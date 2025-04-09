const { seaDb, middleDb, landDb } = require("./db");

// 중간 DB: mid_received_data 테이블 생성
const createMidReceivedDataTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS mid_received_data (
            id SERIAL PRIMARY KEY,
            data JSONB NOT NULL,
            received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await middleDb.query(query);
        console.log("[중간 DB] mid_received_data 테이블 생성 완료");
    } catch (err) {
        console.error("[중간 DB] mid_received_data 테이블 생성 오류:", err.message);
    }
};

// 해상 DB: json_transmission_logs 테이블 생성
const createJsonTransmissionLogsTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS json_transmission_logs (
            id SERIAL PRIMARY KEY,
            sent_data JSONB NOT NULL,
            table_name TEXT,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await seaDb.query(query);
        console.log("[해상 DB] json_transmission_logs 테이블 생성 완료");
    } catch (err) {
        console.error("[해상 DB] json_transmission_logs 테이블 생성 오류:", err.message);
    }
};

const createUserTables = async () => {
    const queries = [
        `
        CREATE TABLE IF NOT EXISTS received_data (
            id SERIAL PRIMARY KEY,
            data JSONB NOT NULL,
            received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
    ];

    try {
        for (const query of queries) {
            await seaDb.query(query);
        }
        console.log("해상 사용자 테이블 생성 완료");
    } catch (err) {
        console.error("사용자 테이블 생성 실패:", err.message);
    }
};



// 실행
const init = async () => {
    await createMidReceivedDataTable();
    await createJsonTransmissionLogsTable();
    await createUserTables();
    console.log("수신 서버용 테이블 초기화 완료");
    // process.exit(); // 종료
};



init();

module.exports = {
    createMidReceivedDataTable,
    createJsonTransmissionLogsTable,
    createUserTables
};