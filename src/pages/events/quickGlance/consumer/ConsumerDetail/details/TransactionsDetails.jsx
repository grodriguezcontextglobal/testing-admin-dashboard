import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Search, Trash2, RefreshCw } from "lucide-react";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import TextFontsize18LineHeight28 from "../../../../../../styles/global/TextFontSize18LineHeight28";
import StripeTransactionTable from "../StripeTransactionTable";
const TransactionsDetails = () => {
  const [searchValue, setSearchValue] = useState("");
  const [trigger, setTrigger] = useState(false);
  const { customer } = useSelector((state) => state.stripe);
  useEffect(() => {
    const controller = new AbortController();
    const refreshing = async () => {
      await setSearchValue(".");
      await setSearchValue("");
    };
    refreshing();
    return () => {
      controller.abort();
    };
  }, [customer.uid]);

  const refetchingTrigger = () => {
    return setTrigger(!trigger);
  };
  return (
    <>
      <Grid
        marginY={3}
        display={"flex"}
        justifyContent={"flex-end"}
        alignItems={"center"}
        gap={1}
        container
      >
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <OutlinedInput
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={OutlinedInputStyle}
            fullWidth
            placeholder="Search a transaction here"
            startAdornment={
              <InputAdornment position="start">
                <Search size={16} />
              </InputAdornment>
            }
            endAdornment={
              <InputAdornment position="end">
                <Trash2
                  size={20}
                  color="var(--blue-dark-600, #155eef)"
                  style={{
                    cursor: "pointer",
                    opacity: String(searchValue).length > 0 ? 1 : 0,
                  }}
                  onClick={() => {
                    setSearchValue("");
                  }}
                />
              </InputAdornment>
            }
          />
        </Grid>
      </Grid>
      <Grid
        marginY={3}
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        container
      >
        <Grid
          border={"1px solid var(--gray-200, #EAECF0)"}
          borderRadius={"12px 12px 0 0"}
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          marginBottom={-2}
          paddingBottom={-2}
          item
          xs={12}
        >
          <p
            style={{
              ...TextFontsize18LineHeight28,
              textTransform: "none",
              padding: "24px",
            }}
          >
            Transactions
          </p>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              outline: "none",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--blue-dark-600, #155eef)",
              fontWeight: 500,
              fontSize: "12px",
              fontFamily: "Inter",
              lineHeight: "28px",
              padding: "0px 8px",
            }}
            onClick={() => refetchingTrigger()}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </Grid>
        <Grid item xs={12}>
          <StripeTransactionTable
            searchValue={searchValue}
            refetchingTrigger={refetchingTrigger}
            triggering={trigger}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default TransactionsDetails;
