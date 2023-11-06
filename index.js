/* 

const express = require('express');
const app = express();
const port = 3000;
const multer = require('multer');
const path = require("path")
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;

app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });




app.get("/", async (req, res) => {
    const indexPath = path.join(__dirname, "index.html");
    res.sendFile(indexPath);
  });


app.post('/split-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdfBuffer = req.file.buffer;
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    const pdfPages = pdfDoc.getPages();
    const pdfPageCount = pdfPages.length;

    for (let i = 0; i < pdfPageCount; i++) {
      const newPdfDoc = await PDFDocument.create();
      const [page] = await newPdfDoc.copyPages(pdfDoc, [i]);
      newPdfDoc.addPage(page);

      const newPdfBytes = await newPdfDoc.save();
      const filename = `split-page-${i + 1}.pdf`;

      await fs.writeFile(filename, newPdfBytes);
    }

    res.json({ message: 'PDF split into individual pages' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
 */
const express = require('express');
const app = express();
const port = 3008;
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const admZip = require('adm-zip');
const path = require('path');

app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get("/", async (req, res) => {
    const indexPath = path.join(__dirname, "index.html");
    res.sendFile(indexPath);
});

app.post('/split-pdf', upload.single('pdfFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const pdfBuffer = req.file.buffer;
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        const pdfPages = pdfDoc.getPages();
        const pdfPageCount = pdfPages.length;

        // Create a temporary directory to store split pages
        const tempDir = path.join(__dirname, 'temp');
        await fs.mkdir(tempDir, { recursive: true });

        for (let i = 0; i < pdfPageCount; i++) {
            const newPdfDoc = await PDFDocument.create();
            const [page] = await newPdfDoc.copyPages(pdfDoc, [i]);
            newPdfDoc.addPage(page);

            const newPdfBytes = await newPdfDoc.save();
            const filename = `split-page-${i + 1}.pdf`;

            const filePath = path.join(tempDir, filename);
            await fs.writeFile(filePath, newPdfBytes);
        }

        // Create a zip file using adm-zip
        const zip = new admZip();
        for (let i = 0; i < pdfPageCount; i++) {
            const filename = `split-page-${i + 1}.pdf`;
            const filePath = path.join(tempDir, filename);
            zip.addLocalFile(filePath, '', filename);
        }

        // Save the zip file
        const zipFileName = path.join(__dirname, 'split-pages.zip');
        zip.writeZip(zipFileName);

        // Send the zip file as a response for download
        res.download(zipFileName, 'split-pages.zip', (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error sending the zip file' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
