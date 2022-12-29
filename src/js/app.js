import Alpine from 'alpinejs'
import { PDFDocument, PageSizes } from 'pdf-lib';

window.Alpine = Alpine

window.convert = async function(content, cbError, cbLogMessage) {
    const sourceDoc = await PDFDocument.load(content, { ignoreEncryption: true });
    const targetDoc = await PDFDocument.create();

    if (sourceDoc.isEncrypted) {
        cbLogMessage('The document is encrypted, stopping.');
        cbError('The document is encrypted.');
        return;
    }

    let numPages = sourceDoc.getPageCount();
    let neededExtraPages = numPages % 4;

    if (neededExtraPages > 0) {
        cbLogMessage(neededExtraPages + ' extra pages needed.')
    }

    for (let i = 0; i < neededExtraPages; i++) {
        sourceDoc.addPage();
    }

    numPages = sourceDoc.getPageCount();

    let numSets = numPages / 4;
    let pageNum1, pageNum2, pageNum3, pageNum4;

    cbLogMessage('The document consists of ' + numSets + ' sets of 4 pages.');

    for (let j = 0; j < numSets; j++) {
        cbLogMessage('Moving pages for set #' + (j+1));

        pageNum1 = numPages - (j * 2) - 1;
        pageNum2 = (j * 2);
        pageNum3 = (j * 2) + 1;
        pageNum4 = numPages - (j * 2) - 2;

        const [page1, page2, page3, page4] = await targetDoc.copyPages(sourceDoc, [pageNum1, pageNum2, pageNum3, pageNum4]);

        targetDoc.addPage(page1);
        targetDoc.addPage(page2);
        targetDoc.addPage(page3);
        targetDoc.addPage(page4);
    }

    cbLogMessage('Saving document, this may take a while.');

    const base64DataUri = await targetDoc.saveAsBase64({ dataUri: true })

    cbLogMessage('Finished saving of document.');

    const a = document.createElement('a');
    a.download = 'booklet.pdf';
    a.href = base64DataUri;

    a.addEventListener('click', (e) => {
        setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
    });

    a.click();
};

window.app = function () {
    return {
        title: 'PDF Booklet Converter',

        showEncryptionWarning: false,

        logMessages: [],

        files: [],

        async convertPdf() {
            this.logMessages = [];

            this.logMessages.push('Start conversion to PDF.');

            this.showEncryptionWarning = false;

            if (this.files.length === 0) {
                this.logMessages.push('No file selected.');
                return;
            }

            let file = this.files[0];

            if (file.type && !file.type.startsWith('application/pdf')) {
                this.logMessages.push('File is not a PDF document.', file.type, file);
                return;
            }

            const reader = new FileReader();

            let that = this;

            reader.addEventListener("load", () => {
                this.logMessages.push('File loaded');
                // convert image file to base64 string
               window.convert(reader.result, function(error) {
                       if (error === 'The document is encrypted.') {
                           that.showEncryptionWarning = true;
                       }
                   },
                   function(logMessage) {
                       that.logMessages.push(logMessage);
                   }
               );
            }, false);

            reader.readAsDataURL(file);

        }
    }
}

Alpine.start()