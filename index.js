const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 3002
const { execSync, exec } = require('child_process');

const required_variables = [
    'APP_NAME', 
    'APP_ID',
    'GENNY_HOST', 
    'GENNY_INITURL', 
    'GENNY_BRIDGE_PORT', 
    'GENNY_BRIDGE_VERTEX', 
    'GENNY_BRIDGE_SERVICE', 
    'GENNY_BRIDGE_EVENTS',
    'GOOGLE_MAPS_APIKEY',
    'GOOGLE_MAPS_APIURL',
    'UPPY_URL',
    'KEYCLOAK_REDIRECTURI',
    'LAYOUT_PUBLICURL',
    'LAYOUT_QUERY_DIRECTORY',
];

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Welcome to GADA Technology.'))
app.post('/build', (req, res) => {

    /* POST request is expecting environment variables which will populate the .env file of alyson v3 */ 
    if(req && req.body) {

        let missing_variables = [];
        let canPerformBuild = true;

        required_variables.forEach(required_variable => {
            
            if(!req.body[required_variable]) {
                missing_variables.push(required_variable);
                canPerformBuild = false;
            }
        });

        if(canPerformBuild) {

            /* we execute these commands to pull v3 */
            const cmds = [
                "rm -rf github",
                "mkdir github",
                "cd github && git clone https://github.com/genny-project/alyson-v3",
                "touch github/alyson-v3/.env"
            ]

            /* we execute this command to set up the .env file */
            Object.keys(req.body).forEach(variable => {

                cmds.push(
                    'echo "' + variable + '=' + req.body[variable] + '" >> github/alyson-v3/.env'
                )
            });

            /* start fastlane */
            cmds.push("cd github/alyson-v3/ && npm i && npm run build:ios");
            cmds.push("cd github/alyson-v3/ios/fastlane && fastlane");

            console.log(cmds);

            for(let i = 0; i < cmds.length; i++) {

                const cmd = cmds[i];
                if(i < cmds.length - 1) {
                    execSync(cmd);
                }
                else {

                    console.log("final command: ");
                    exec(cmd, (err, stdout, stderr) => {
                        
                        if (err) {
                            res.status(200);
                            res.send({
                                status: "error",
                                message: "An error occured."
                            });
                            return;
                        }
                        
                        res.status(200);
                        res.send({
                            status: "ok",
                            message: ""
                        });
        
                        // the *entire* stdout and stderr (buffered)
                        console.log(`stdout: ${stdout}`);
                        console.log(`stderr: ${stderr}`);
                    });
                }
            }
        }
        else {
            res.status(200);
            res.send({
                error: 'Missing variables: ' + missing_variables
            })
        }
    }
});

app.listen(port, () => console.log(`Gennylane listening on port ${port}!`))

