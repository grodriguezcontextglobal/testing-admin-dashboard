/* eslint-disable no-unused-vars */
import { Typography } from "@mui/material";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  // PDFDownloadLink,
  pdf,
} from "@react-pdf/renderer";
import { Button, message } from "antd";
import { saveAs } from "file-saver";
import { useState } from "react";

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#E4E4E4",
    padding: 20,
  },
  header: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderColor: "#bfbfbf",
    borderWidth: 1,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    borderStyle: "solid",
    borderColor: "#bfbfbf",
    borderWidth: 1,
    padding: 5,
    flexGrow: 1,
    backgroundColor: "#004EEB",
  },
  tableCol: {
    borderStyle: "solid",
    borderColor: "#bfbfbf",
    borderWidth: 1,
    padding: 5,
    flexGrow: 1,
  },
  tableCellHeader: {
    margin: "auto",
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  tableCell: {
    margin: "auto",
    fontSize: 8,
  },
});

// Define the document to be generated
const FileGenerator = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page} orientation="landscape">
      <Text style={styles.header}>Stock Report</Text>
      {/* Render table header */}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          {[
            "Serial Number",
            "Warehouse",
            "Brand",
            "Category Name",
            "Group Name",
            "Ownership",
            "Cost of Replacement (USD)",
            "Condition",
            "Current Location",
            "Tax Location",
            "Assignable",
            "Rented Equipment Return Date",
            "Extra Info",
            "Description",
          ].map((header, index) => (
            <View key={index} style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>{header}</Text>
            </View>
          ))}
        </View>
        {/* Render table rows dynamically based on the provided data */}
        {data.map((item, rowIndex) => (
          <View key={rowIndex} style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.data.serial_number}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item.data.warehouse === 1 ? "In-Stock" : "In-Use"}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.data.brand}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.data.category_name}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.data.item_group}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item.data.ownership === "Rent"
                  ? "Rented"
                  : item.data.ownership === "Permanent"
                  ? "Owned"
                  : "For Sale"}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.data.cost}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.data.status}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item.data.warehouse === 1
                  ? item.data.location
                  : item.data.event_name}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.data.main_warehouse}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item.data.enableAssignFeature === 1
                  ? "Assignable"
                  : "No Assignable"}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item.data.ownership === "Rent" ? item.data.return_date : ""}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {item.data.extra_serial_number.length > 0
                  ? item.data.extra_serial_number
                      .map(
                        (extra) => `- ${extra.keyObject}: ${extra.valueObject}`
                      )
                      .join(", ")
                  : "N/A"}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.data.descript_item}</Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

// Main component to trigger download and save
const DownloadPdf = ({ data }) => {
  const [isLoading, setIsLoading] = useState(false);
  // Function to generate and save the PDF manually
  const generateAndSavePdf = async () => {
    setIsLoading(true);
    const blob = await pdf(<FileGenerator data={data} />).toBlob(); // Generate the PDF as a blob
    saveAs(blob, `excel_stock_report_${Date.now()}.pdf`); // Use file-saver to save the file
    setIsLoading(false);
    message.open({
      type: "success",
      content: "excel file generated and downloading.",
    });
  };

  return (
    <div>
      {/* <PDFDownloadLink */}
      <Button
        // document={<FileGenerator data={data} />}
        // fileName={`excel_stock_report_${Date.now()}.pdf`}
        loading={isLoading}
        onClick={() => {
          message.loading({
            content: "excel file generating...",
          });
          generateAndSavePdf();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          borderTop: "transparent",
          borderRight: "transparent",
          borderBottom: "transparent",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <Typography
          textTransform={"none"}
          textAlign={"left"}
          fontWeight={500}
          fontSize={"12px"}
          fontFamily={"Inter"}
          lineHeight={"28px"}
          color={"var(--blue-dark--700, #004EEB)"}
          padding={"0px"}
        >
          {({ blob, url, loading, error }) => loading && "Loading document..."}
          Export record&nbsp;(
          <span style={{ textDecoration: "underline" }}>.pdf</span>)
        </Typography>
      </Button>
      {/* </PDFDownloadLink> */}
    </div>
  );
};

export default DownloadPdf;
