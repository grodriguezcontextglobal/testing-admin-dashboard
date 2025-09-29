import {
    Box,
    Collapse,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    Typography
} from "@mui/material";
import { useState } from "react";
import { DownNarrow } from "../../../../../../components/icons/DownNarrow";
import { UpNarrowIcon } from "../../../../../../components/icons/UpNarrowIcon";

export const RentedInventoryTable = ({
  type,
  rows,
  emptyText = "No rented items",
  collapsible = true,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expanded, setExpanded] = useState(false);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const paginatedRows = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (!rows || rows.length === 0) {
    return (
      <Box p={2} textAlign="center">
        <Typography variant="body2" color="textSecondary">
          {emptyText}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {collapsible && (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          p={1}
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            borderRadius: 1,
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.08)",
            },
          }}
          onClick={handleToggleExpanded}
        >
          <Typography variant="subtitle2" fontWeight="medium">
            {type === 1 ? "Owned" : "Rented"} Inventory Details ({rows.length}{" "}
            items)
          </Typography>
          <IconButton size="small">
            {expanded ? <UpNarrowIcon /> : <DownNarrow />}
          </IconButton>
        </Box>
      )}

      <Collapse in={!collapsible || expanded}>
        <Box mt={collapsible ? 1 : 0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Serial</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row, index) => (
                <TableRow key={row.serial_number || index}>
                  <TableCell>{row.category_name || "N/A"}</TableCell>
                  <TableCell>{row.item_group || "N/A"}</TableCell>
                  <TableCell>{row.serial_number || "N/A"}</TableCell>
                  <TableCell>{row.location || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={rows.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Box>
      </Collapse>
    </Box>
  );
};