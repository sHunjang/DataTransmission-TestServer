const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const { middleDb, seaDb, landDb } = require("./db/db"); // 중간 DB, 해상 사용자 DB 연결

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());


/**
 * JSON 수신 데이터 -> 육상, 중간 DB 저장
 */
app.post("/upload-json", async (req, res) => {
    const jsonData = req.body;

    try {
        // 중간 DB에 저장
        await middleDb.query(
            `INSERT INTO mid_received_data (data) VALUES ($1)`,
            [jsonData]
        );

        // 육상 DB에도 저장
        await landDb.query(
            `INSERT INTO json_data (data) VALUES ($1)`,
            [jsonData]
        );

        console.log("중간 DB와 육상 DB에 JSON 데이터 저장 완료");
        res.status(200).json({ message: "중간 + 육상 DB 저장 완료" });
    } catch (err) {
        console.error("저장 실패:", err.message);
        res.status(500).json({ message: "저장 실패" });
    }
});

/**
 * 중간 DB 데이터 삭제
 */
app.delete("/delete-mid-data", async (req, res) => {
    try {
        await middleDb.query(`DELETE FROM mid_received_data`);
        console.log("중간 DB의 mid_received_data 테이블 전체 삭제 완료");
        res.json({ message: "중간 DB 데이터 삭제 완료" });
    } catch (err) {
        console.error("중간 DB 삭제 실패:", err.message);
        res.status(500).json({ message: "삭제 실패" });
    }
});

/**
 * 사용자 테이블 목록 조회 (해상 DB 기준)
 */
app.get("/user-tables", async (req, res) => {
    try {
        const result = await seaDb.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE 'user_%'
        `);
        const tableNames = result.rows.map(row => row.table_name);
        res.json(tableNames);
    } catch (err) {
        console.error("사용자 테이블 목록 조회 실패:", err.message);
        res.status(500).json({ message: "조회 실패" });
    }
});

/**
 * 중간 DB → 사용자 테이블로 데이터 이동 (해상 DB 기준)
 */
app.post("/move-to-user-table", async (req, res) => {
    const { targetTable } = req.body;
    if (!targetTable) {
        return res.status(400).json({ message: "타겟 테이블명이 필요합니다." });
    }

    try {
        const result = await middleDb.query(`SELECT * FROM mid_received_data`);
        const rows = result.rows;

        for (const row of rows) {
            await seaDb.query(
                `INSERT INTO ${targetTable} (data, received_at) VALUES ($1, $2)`,
                [row.data, row.received_at]
            );
        }

        await middleDb.query(`DELETE FROM mid_received_data`);
        console.log(`${rows.length}건의 데이터가 사용자 테이블로 이동 완료`);

        res.json({ message: `${rows.length}건 이동 완료` });
    } catch (err) {
        console.error("사용자 테이블 이동 실패:", err.message);
        res.status(500).json({ message: "이동 실패" });
    }
});

app.listen(PORT, () => {
    console.log(`해상 수신 서버 실행 중: http://localhost:${PORT}`);
});