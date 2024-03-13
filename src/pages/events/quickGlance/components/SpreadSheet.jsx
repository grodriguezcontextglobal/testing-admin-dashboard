import { version, utils, writeFileXLSX } from 'xlsx';

const SpreadSheet = async ({props}) => {
        /* fetch JSON data and parse */
        const raw_data = await props;

        /* filter for the Presidents */
        const prez = raw_data.filter(row => row.terms.some(term => term.type === "prez"));

        /* sort by first presidential term */
        prez.forEach(row => row.start = row.terms.find(term => term.type === "prez").start);
        prez.sort((l, r) => l.start.localeCompare(r.start));

        /* flatten objects */
        const rows = prez.map(row => ({
            name: row.name.first + " " + row.name.last,
            birthday: row.bio.birthday
        }));

        /* generate worksheet and workbook */
        const worksheet = utils.json_to_sheet(rows);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Dates");

        /* fix headers */
        utils.sheet_add_aoa(worksheet, [["Name", "Birthday"]], { origin: "A1" });

        /* calculate column width */
        const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
        worksheet["!cols"] = [{ wch: max_width }];

        /* create an XLSX file and try to save to Presidents.xlsx */
        writeFileXLSX(workbook, "Presidents.xlsx");
//     return (
//         <div>
//             SpreadSheet
//             <div>
//                 <button onClick={() => xport()}>Export with SheetJS version {{ version }}</button>
//         </div>
//         </div >
//   )
}

export default SpreadSheet