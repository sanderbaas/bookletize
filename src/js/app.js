import Alpine from 'alpinejs'
import { PDFDocument, PageSizes } from 'pdf-lib';

window.Alpine = Alpine

window.convert = async function(content) {
    const sourceDoc = await PDFDocument.load(content);
    const targetDoc = await PDFDocument.create();

    let numPages = sourceDoc.getPageCount();
    let neededExtraPages = numPages % 4;

    for (let i = 0; i < neededExtraPages; i++) {
        sourceDoc.addPage();
    }

    numPages = sourceDoc.getPageCount();

    let numSets = numPages / 4;
    let sourcePages = sourceDoc.getPages();
    let pageNum1, pageNum2, pageNum3, pageNum4;

    for (let j = 0; j < numSets; j++) {
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

    const base64DataUri = await targetDoc.saveAsBase64({ dataUri: true })

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

        files: [],

        async convertPdf() {
            console.log('Start conversion to PDF')
            ;
            if (this.files.length === 0) {
                console.log('No file selected.');
                return;
            }

            let file = this.files[0];

            if (file.type && !file.type.startsWith('application/pdf')) {
                console.log('File is not an image.', file.type, file);
                return;
            }

            const reader = new FileReader();

            reader.addEventListener("load", () => {
                // convert image file to base64 string
                // console.log(reader.result);
                window.convert(reader.result);
            }, false);

            reader.readAsDataURL(file);

        }
    }
}

Alpine.start()