const helper_functions = require("./helper_functions")

// const db = require("./database/dbmethods")
const chess = require("./chess")

const path = require("path");
const { handleDatabase } = require("./database");

async function handleSignUp(app) {
    const db = await handleDatabase('Chess')

    app.post('/getotp', async (req, res) => {
        const requestData = req.body;
        const email = requestData.email
        const username = requestData.username
        let emailSearch = await db.collection("users").findOne({ email: email });
        let usernameSearch = await db.collection('users').findOne({ username: username })
        if (emailSearch) {
            /**Email exits */
            res.send({ ok: false, message: "An account with this email already exists!" })
            return;
        }
        if (usernameSearch) {
            /**username exists */
            res.send({ ok: false, message: "Sorry! this username is already taken" })
            return;
        }
        let code = helper_functions.generateCode(6);
        console.log("Code", code)
        helper_functions.sendOTP(email, username, code)
            .then(async (data) => {
                console.log("email sent")
                const authToken = helper_functions.generateToken(16);
                const authenticationToken = { token: authToken, otp: code, username, email, startTime: new Date().getTime(), lifeTime: 300000, valid: true }
                await db.collection('auth-tokens').insertOne(authenticationToken);
                res.send({ message: "Email has been sent to your email id: " + requestData.email, ok: true, url: `${authToken}` });

            })
            .catch(err => {
                console.error("Error", err)
                res.send({ message: 'Internal server error or invalid Email:', ok: false })
            })

    });

    app.get(`/signup/auth/`, (req, res) => {
        res.sendFile(
            path.join(__dirname, "/public/src/otpauth.html")
        );
    })

    app.post('/auth', async (req, res) => {
        let requestData = req.body;
        const providedToken = requestData.token;
        const providedOTP = requestData.otp;
        const authenticationToken = await db.collection('auth-tokens').findOne({ otp: providedOTP });

        console.log("authentication token", authenticationToken);
        console.log("provided details", { providedOTP, providedToken });
        if (authenticationToken && providedToken == authenticationToken.token && providedOTP === authenticationToken.otp && authenticationToken.valid && (new Date().getTime() - authenticationToken.startTime <= authenticationToken.lifeTime)) {
            const password = helper_functions.generateToken(8);
            const email = authenticationToken.email, username = authenticationToken.username;
            helper_functions.sendAccountDetails(email, username, password)
                .then(async (data) => {
                    const users = await db.collection("users")
                    const userid = await users.countDocuments() + 1;
                    await users.insertOne({ userid: userid, email: email, password: password, username: username })
                    let info = {
                        username: username, email: email, rating: 300, total_games: 0, games_won: 0, games_lost: 0, games_won_as_white: 0, games_won_as_black: 0, games_draw: 0, games: [], title: "NB"
                    }
                    await db.collection("game_info").insertOne({ userid: userid, info: info });
                    res.send({ ok: true, username })
                })
                .catch(err => {
                    console.log("Error:", err)
                    res.send({ ok: false, errMessage: "Unknown Error: Error Authenticating Email!" })
                })

            await db.collection('auth-tokens').deleteOne({ otp: providedOTP });
        }
        else {

            res.send({ ok: false, errMessage: "Invalid OTP or session Expired" })
            await db.collection('auth-tokens').deleteOne({ otp: providedOTP });
            await db.collection('auth-tokens').deleteOne({ token: providedToken });
        }
    })



    app.post('/authentication', async (req, res) => {
        const requestData = req.body;

        let searchData = await db.collection("users").findOne({ email: requestData.email, password: requestData.password });
        console.log("Search data", searchData)
        if (searchData) {
            let sessionId = helper_functions.generateToken(16);
            req.session.sessionId = sessionId;
            saveUserInfo(requestData.email, sessionId)
                .then(val => {
                    res.send({ ok: true, url: "/play" })

                })
                .catch(err => {
                    res.send({ ok: false, errMessage: err })

                })
        }
        else {
            res.send({ ok: false })

        }
    })

    app.post('/fetch_info', async (req, res) => {
        const db = await handleDatabase("Chess");
        const sessionId = req.session.sessionId;
        // Ensure this code is inside an async function or use .then() to handle the promise.
        const user = await db.collection("session_tokens").findOne({ "token.session_id": sessionId, "token.expired": false });

        if (user) {
            /**User existe */
            const userid = user.userid;
            const primaryInfo = await db.collection("users").findOne({ userid: userid })
            const username = primaryInfo.username, email = primaryInfo.email;
            const userInfo = await db.collection("game_info").findOne({ userid: userid });
            const obj = { ...userInfo.info }

            obj.userid = userid


            console.log("obj:", obj)
            res.send({ ok: true, userInfo: obj })
        }
        else {
            res.send({ ok: false, errMessage: "Error fetching data from the server! Reload Browser" })
        }
    })
}


async function saveUserInfo(email, sessionId) {
    const db = await handleDatabase("Chess")
    let userData = await db.collection("users").findOne({ email: email });
    const userid = userData.userid;

    await db.collection('session_tokens').deleteMany({ userid })

    const obj = {
        "userid": userData.userid, "token": {
            "session_id": sessionId, "expired": false
        }
    }

    await db.collection("session_tokens").insertOne(obj)
}

module.exports = { handleSignUp }