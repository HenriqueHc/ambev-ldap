import { version } from '../../package.json';
import { Router } from 'express';
import facets from './facets';
import ldap from 'ldapjs';
import config from "../config";

let ldapClient;

let connect = () => {
    let ldapClientConfig = {
        url: "ldap://" + (process.env.LDAPSERVER || config.server)
    };
    ldapClient = ldap.createClient(ldapClientConfig);
};

let changePass = (user, pass) => {

    ldapClient.bind('CN=Administrator,CN=Users,DC=lab,DC=net', 'temp@123', function(err) {
        err ? console.log(err) : console.log("Admin logado.");
    });

    let change = new ldap.Change({
        operation: 'replace',
        modification: {
            userPassword: pass
        }
    });

    let userCN = "CN=" + user + ",CN=Users,DC=lab,DC=net";
    ldapClient.modify(userCN, change, function(err) {
        err ? console.log(err) : console.log("Reset feito com sucesso!");
    });
};

export default ({ config, db }) => {
	let api = Router();

	// mount the facets resource
	api.use('/facets', facets({ config, db }));

	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({ version });
	});
    api.get('/health-check', (req, res) => {
        res.json("OK");
    });

    api.get('/connect', (req, res) => {
        connect();
        res.json("Server Connected");
    });

    api.get('/change-pass/:user/:pass', (req, res) => {
        const user = req.params.user;
        const pass = req.params.pass;

        changePass(user, pass);

        res.json(
            {
                user: user,
                pass: pass
            }
        );
    });
	return api;
}
