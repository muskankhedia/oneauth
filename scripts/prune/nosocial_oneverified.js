/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const config = require('../../config');
const secret = config.SECRETS;
const {db, models: {
	User
}} = require('../../src/db/models');
/*
 * Users with multiple accounts with same email
 * Out of which one is verified
 * None of them tied to social network
 */
async function runPrune() {
	try {

		const [users, result] = await db.query(`
select count("email"), count("verifiedemail") as "verifieds", "email",
        count("userfacebooks"."id") as "fb",
        count("usergithubs"."id") as "gh",
        count("usertwitters"."id") as "tw"
from "users"
    left outer join "userfacebooks" on "userfacebooks"."userId" = "users"."id"
    left outer join "usergithubs" on "usergithubs"."userId" = "users"."id"
    left outer join "usertwitters" on "usertwitters"."userId" = "users"."id"
where "users"."deletedAt" is null
group by "email"
having
    count("email") > 1 and
    count("verifiedemail") = 1 and
    count("userfacebooks"."id") < 1 and
    count("usergithubs"."id") < 1 and
    count("usertwitters"."id") < 1
        `);
		console.log('Going to delete ' + users.length + ' users');
		/* Delete the ones which are not verified */
		for (let user of users) {
			console.log('Deleting for ' + user.email );
			await User.destroy({
				where: {
					email: user.email,
					verifiedemail: {$eq: null}
				}
			});
		}



	} catch (err) {
		console.error(err);
	} finally {
		process.exit();
	}
}

runPrune();

/*
    NOTES:
    This deleted (paranoid) 329 users on 2018-06-15T18:06:57.072Z
 */