
import { QueryResult } from 'pg';
import { pool } from './_getPool';
import ApiError from '../Exeptions/ApiError';
type getList = {
    setting: {
        start: number,
        count: number
    },
    filter: {},
    MODE: "sequrity" | "forAll"
}
type UserToCookie = {
    mail: string,
    nickname: string,
    id: number,
    mailveryfity: boolean,
    roles: {
        user: boolean,
        master: boolean,
        admin: boolean
    }
};
class UserService {
    getMasMode(MODE: "sequrity" | "forAll") {
        let mas = ['id'];
        //TODO: Добавить получение роли
        switch (MODE) {
            case "sequrity": {
                mas = mas.concat(['nickname', 'mail', 'mailVeryfity'])
                break;
            }
            case "forAll": {
                mas = mas.concat(['nickname'])
                break;
            }
        }
        return mas;
    }
    async getUserInfoById({ id, MODE }: { id: number, MODE: "sequrity" | "forAll" }): Promise<UserToCookie> {
        return (await pool.query(`SELECT ${this.getMasMode(MODE).join(', ')} FROM users WHERE id = $1`, [id]))?.rows?.[0] as UserToCookie;
    }
    async isUserUser({ id }: { id: number }): Promise<boolean> {
        return (await pool.query(`SELECT (SELECT count(*) FROM users WHERE id = $1) > 0 as bol`, [id])).rows[0].bol;
    }
    async isUserMaster({ id }: { id: number }): Promise<boolean> {
        return (await pool.query(`SELECT (SELECT count(*) FROM masters WHERE id = $1 AND active = True) > 0 as bol`, [id])).rows[0].bol;
    }
    async isUserAdmin({ id }: { id: number }): Promise<boolean> {
        return (await pool.query(`SELECT (SELECT count(*) FROM admins WHERE id = $1) > 0 as bol`, [id])).rows[0].bol;
    }
    async getMasterActive({ id }: { id: number }): Promise<boolean | undefined> {
        return (await pool.query(`SELECT active FROM masters WHERE id = $1`, [id]))?.rows?.[0]?.active;
    }
    async downMaster({ id }: { id: number }): Promise<boolean | undefined> {
        return (await pool.query(`UPDATE masters SET active = False WHERE id = $1;`, [id]))?.rowCount as number > 0;
    }
    async upgradeUserToMater({ id }: { id: number }): Promise<boolean | undefined> {
        return (await pool.query(`INSERT INTO masters (id) VALUES ($1);`, [id]))?.rowCount as number > 0;
    }
    async returnMaster({ id }: { id: number }): Promise<boolean | undefined> {
        return (await pool.query(`UPDATE masters SET active = True WHERE id = $1 ;`, [id]))?.rowCount as number > 0;
    }
    async getUserList({ setting, filter, MODE }: getList) {
        let filterStr = '';
        //TODO: реализовать строку фильтра
        for (let add of Object.keys(filter)) {
            if (filterStr.length == 0)
                filterStr = 'WHERE '
            else
                filterStr += 'AND '
            switch (add) {
                case 'maxplayers':
                    // filterStr += 'maxplayers = ' + filterStr.maxplayers
                    break;
                default:
                    break;
            }
        }
        return (await pool.query(`SELECT * FROM users LIMIT $1 OFFSET $2;`, [setting.count, setting.start])).rows as UserToCookie[];
    }
    async changePass({ id, cache, mail }: { id: number, cache: string, mail: string }): Promise<boolean> {
        return (await pool.query(`UPDATE users SET passcache = $1 WHERE mail = $2 AND id = $3;`, [cache, mail, id])).rowCount as number > 0;
    }
    async changeNickName({ id, mail, nickname }: { id: number, nickname: string, mail: string }): Promise<boolean> {
        return (await pool.query(`UPDATE users SET nickname = $1 WHERE mail = $2 AND id = $3;`, [nickname, mail, id])).rowCount as number > 0;
    }
    async changeDescription({ id, description }: { id: number, description: string }): Promise<boolean> {
        return (await pool.query(`UPDATE masters SET description = $2 WHERE id = $1`, [id, description])).rowCount as number > 0;
    }
    async changeMail({ id, mail }: { id: number, mail: string }): Promise<boolean> {
        return (await pool.query(`UPDATE users SET mail = $1, mailveryfity = $3 WHERE  id = $2;`, [mail, id, false])).rowCount as number > 0;
    }
    async getMyLinkActivate({ link }: { link: string }): Promise<{ userid: number, dateend: Date, mail: string } | undefined> {
        return (await pool.query(`SELECT userid, dateend, mail FROM maillink WHERE link = $1;`, [link])).rows?.[0];
    }
    async addLinkActivate({ mail, userid, link }: { mail: string, userid: number, link: string }): Promise<boolean> {
        return (await pool.query(`INSERT INTO maillink (mail, userid, link, dateend) VALUES ($1, $2, $3, now() + '5 hour'::interval)`, [mail, userid, link])).rowCount as number > 0;
    }
    async deleteMyLink({ userid }: { userid: number }): Promise<boolean> {
        return (await pool.query(`DELETE FROM maillink WHERE userid = $1;`, [userid])).rowCount as number > 0;
    }
    async changeMailVerifity({ userid, mail, value }: { userid: number, mail: string, value: boolean }): Promise<boolean> {
        return (await pool.query(`UPDATE users SET mail = $2, mailveryfity = $3 WHERE id = $1`, [userid, mail, value])).rowCount as number > 0;
    }
    async addUser({ mail, nickname, cache }: { mail: string, nickname: string, cache: string }) {
        return (await pool.query(`INSERT INTO users(mail, passcache, nickname) VALUES ($1, $2, $3) RETURNING id;`, [mail, cache, nickname])).rows?.[0]?.id;
    }
    async findUserMail({ mail }: { mail: string }): Promise<undefined | { passcache: string, id: number, nickname: string }> {
        return (await pool.query(`SELECT passcache, id, nickname FROM users WHERE mail = $1`, [mail]))?.rows?.[0];
    }
    async getRefreshToken({ id, hash }: { id: number, hash: string }): Promise<string | undefined> {
        return (await pool.query(`SELECT refreshtoken FROM refreshtokens WHERE userid = $1 AND fingerprint = $2`, [id, hash])).rows?.[0]?.refreshtoken;
    }
    async isUserExists({ id }: { id: number }): Promise<boolean> {
        return (await pool.query(`SELECT (SELECT count(*) FROM users WHERE id = $1) > 0 as bol`, [id])).rows[0].bol;
    }
    async isMasterExists({ id }: { id: number }): Promise<boolean> {
        return (await pool.query(`SELECT (SELECT count(*) FROM masters WHERE id = $1) > 0 as bol`, [id])).rows[0].bol;
    }
    async isMailExists({ mail }: { mail: string }): Promise<boolean> {
        return (await pool.query(`SELECT (SELECT count(id) FROM users WHERE mail = $1) > 0 as bol`, [mail])).rows[0].bol;
    }
    async isNameExists({ nickname }: { nickname: string }): Promise<boolean> {
        return (await pool.query(`SELECT (SELECT count(id) as sum FROM users WHERE nickname = $1) > 0 as bol`, [nickname])).rows[0].bol;
    }
}

export default new UserService();