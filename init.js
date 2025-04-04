const pool = require("./db"); // ← DB 연결 객체

const createMidAndUserTables = async () => {
    try {
        // 중간 저장 테이블
        await pool.query(`
            CREATE TABLE IF NOT EXISTS mid_received_data (
                id SERIAL PRIMARY KEY,
                data JSONB NOT NULL,
                received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 예시 사용자 테이블
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_data (
                id SERIAL PRIMARY KEY,
                data JSONB NOT NULL,
                received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_sensor (
                id SERIAL PRIMARY KEY,
                data JSONB,
                received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("테이블 자동 생성..");
    } catch (err) {
        console.error("테이블 생성 실패:", err);
    }
};

module.exports = { createMidAndUserTables };