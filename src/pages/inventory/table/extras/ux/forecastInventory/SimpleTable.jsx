import {
    Box,
    Card,
    CardContent,
    Collapse,
    IconButton,
    List,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    Typography
} from "@mui/material";
import { useMemo, useState } from "react";
import { DownNarrow } from "../../../../../../components/icons/DownNarrow";
import { UpNarrowIcon } from "../../../../../../components/icons/UpNarrowIcon";

const VirtualizedTable = ({
  rows,
  columns,
  emptyText = "No data",
  itemHeight = 53,
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

  const paginatedRows = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return rows.slice(startIndex, startIndex + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const TableRow = ({ index, style }) => {
    const row = paginatedRows[index];
    if (!row) return null;

    return (
      <div style={style}>
        <Table size="small">
          <TableBody>
            <TableRow hover>
              {columns.map((column) => (
                <TableCell key={column.key} sx={{ py: 1 }}>
                  {typeof column.render === "function"
                    ? column.render(row)
                    : row[column.dataIndex]}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  };

  if (rows.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            {emptyText}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 0 }}>
        {/* Header with collapse/expand */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle2">{rows.length} items</Typography>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            aria-label={expanded ? "collapse" : "expand"}
          >
            {expanded ? <DownNarrow /> : <UpNarrowIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          {/* Table Header */}
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key} sx={{ fontWeight: "bold" }}>
                    {column.title}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
          </Table>

          {/* Virtualized Table Body */}
          {paginatedRows.length > 0 && (
            <List
              height={Math.min(400, paginatedRows.length * itemHeight)}
              itemCount={paginatedRows.length}
              itemSize={itemHeight}
              width="100%"
            >
              {TableRow}
            </List>
          )}

          {/* Pagination */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <TablePagination
              component="div"
              count={rows.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              showFirstButton
              showLastButton
            />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export const SimpleTable = ({
  rows,
  columns,
  emptyText = "No data",
  virtualized = false,
  collapsible = false,
}) => {
  const [expanded, setExpanded] = useState(!collapsible);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const paginatedRows = useMemo(() => {
    if (rows.length <= 10) return rows; // No pagination for small datasets
    const startIndex = page * rowsPerPage;
    return rows.slice(startIndex, startIndex + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  // Use virtualized table for large datasets
  if (virtualized || rows.length > 50) {
    return (
      <VirtualizedTable rows={rows} columns={columns} emptyText={emptyText} />
    );
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 0 }}>
        {collapsible && (
          <Box
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="subtitle2">{rows.length} items</Typography>
            <IconButton
              onClick={() => setExpanded(!expanded)}
              size="small"
              aria-label={expanded ? "collapse" : "expand"}
            >
              {expanded ? <DownNarrow /> : <UpNarrowIcon />}
            </IconButton>
          </Box>
        )}

        <Collapse in={expanded}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key} sx={{ fontWeight: "bold" }}>
                    {column.title}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {emptyText}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row, index) => (
                  <TableRow key={index} hover>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {typeof column.render === "function"
                          ? column.render(row)
                          : row[column.dataIndex]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination for larger datasets */}
          {rows.length > 10 && (
            <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
              <TablePagination
                component="div"
                count={rows.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};
