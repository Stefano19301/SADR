import { pool } from '../Services/_getPool';
import { NoticeMessage } from 'pg-protocol/dist/messages';

const SQLaddNext = async () => {
    try {
        const values = [
            [1, 2],
            [1, 3],
            [2, 1],
            [2, 3],
            [3, 3]
        ]
        await pool.query(`INSERT INTO usersofplay(playid, userid)
            VALUES 
            (${values.map((val) => { return val.join(', ') }).join('),\n(')})
            ;`);
        console.log("Допки добавлены")
    } catch (error) {
        const er = error as NoticeMessage;
        Object.keys(er).forEach(element => {
            console.log(element, ": ", er[element as keyof NoticeMessage]);
        });
        console.log(er)
        if (er.routine == 'auth_failed')
            console.log("Ошибка авторизации")
    }
}

export default SQLaddNext;