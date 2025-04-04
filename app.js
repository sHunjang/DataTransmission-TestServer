const { Pool } = require("pg");
require("dotenv").config(); // 맨 위에 추가

const port = process.env.PORT || 4000;

const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
});

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const { createMidAndUserTables } = require("./init");


const app = express();

app.use(cors());
app.use(express.json()); // JSON 요청 처리

const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || "uploads");

createMidAndUserTables();

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// 파일 업로드용 multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// JSON 데이터 수신 라우터
app.post("/upload-json", (req, res) => {
    const jsonData = req.body;

    if (!jsonData) {
        return res.status(400).json({ message: "JSON 데이터가 없음" });
    }

    const fileName = `json_${new Date().toISOString().slice(0, 10)}.json`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
            console.error("JSON 저장 실패:", err);
            return res.status(500).json({ message: "저장 실패", error: err.message });
        }

        console.log(`JSON 저장됨: ${fileName}`);
        console.log("저장된 내용:\n", JSON.stringify(jsonData, null, 2));

        res.status(200).json({ message: "JSON 파일 저장 완료", file: fileName });
    });
});

// 파일 업로드 라우터
app.post("/upload", upload.array("file"), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "받은 파일이 없음.." });
        }

        const zipName = `received_${new Date().toISOString().slice(0, 10)}.zip`;
        const zipPath = path.join(uploadDir, zipName);

        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => console.log(`${zipName} 저장 완료 (${archive.pointer()} bytes)`));
        archive.on("error", (err) => { throw err; });

        archive.pipe(output);
        files.forEach((file) => {
            archive.file(file.path, { name: file.originalname });
        });
        await archive.finalize();

        // 개별 파일 삭제
        files.forEach((file) => fs.unlinkSync(file.path));

        res.status(200).json({
            message: "수신 파일 zip 저장 완료",
            zipFile: zipName,
        });
    } catch (err) {
        console.error("압축 실패:", err);
        res.status(500).json({ message: "압축 실패", error: err.message });
    }
});

app.delete("/delete-mid-data", async (req, res) => {
    try {
        const query = `DELETE FROM mid_received_data`;
        await pool.query(query);
        console.log("🧹 중간 테이블 데이터 모두 삭제됨");
        res.json({ message: "중간 데이터 삭제 완료" });
    } catch (err) {
        console.error("삭제 오류:", err);
        res.status(500).json({ message: "삭제 실패", error: err.message });
    }
});

app.post("/move-to-user-table", async (req, res) => {
    const { targetTable } = req.body;
    if (!targetTable) {
        return res.status(400).json({ message: "타겟 테이블명이 필요합니다." });
    }

    try {
        const selectQuery = `SELECT * FROM mid_received_data`;
        const result = await pool.query(selectQuery);

        const dataRows = result.rows;

        for (const row of dataRows) {
            const insertQuery = `
                INSERT INTO ${targetTable} (data, received_at)
                VALUES ($1, $2)
            `;
            await pool.query(insertQuery, [row.data, row.received_at]);
        }

        // 전송 후 중간 테이블 데이터 삭제
        await pool.query(`DELETE FROM mid_received_data`);

        res.json({ message: `${dataRows.length}건이 ${targetTable}로 이동 완료` });
    } catch (err) {
        console.error("이동 오류:", err);
        res.status(500).json({ message: "이동 실패", error: err.message });
    }
});


app.get("/user-tables", async (req, res) => {
    try {
        const query = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE 'user_%'
        `;
        const result = await pool.query(query);
        const tableNames = result.rows.map((row) => row.table_name);
        console.log("사용자 테이블 목록:", tableNames);
        res.json(tableNames);
    } catch (err) {
        console.error("사용자 테이블 조회 실패:", err.message);
        res.status(500).json({ message: "테이블 조회 실패" });
    }
});

app.listen(port, () => {
    console.log(`수신 서버 실행 중: http://localhost:${port}`);
});