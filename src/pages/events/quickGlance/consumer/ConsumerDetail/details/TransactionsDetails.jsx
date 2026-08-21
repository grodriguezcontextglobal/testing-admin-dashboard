import { InputAdornment, OutlinedInput } from "@mui/material";
import { Search, X } from "lucide-react";
import { useState } from "react";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import { ProfileSection } from "../../../../../../components/UX/profile";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import "../../consumerDetail.css";
import StripeTransactionTable from "../StripeTransactionTable";

/**
 * The Transactions tab.
 *
 * Search moved into the section head, beside the count it filters. It used to be
 * a full-width input in its own container above the panel, which read as a
 * page-level search — and the "Transactions" heading below it was a bare
 * bordered div glued to the table with `marginBottom: -2` and
 * `paddingBottom: -2` (not a valid CSS length, so it did nothing anyway).
 *
 * The refresh control is a real button rather than a text link: it performs an
 * action, and a link that does not navigate is a lie about what will happen.
 */
const TransactionsDetails = () => {
  const [searchValue, setSearchValue] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <ProfileSection
      title="Transactions"
      description="Expand a transaction to assign, return, or write off its devices."
      testId="consumer-transactions-section"
      actions={
        <div className="consumer-toolbar">
          <div className="consumer-toolbar__search">
            <OutlinedInput
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              style={OutlinedInputStyle}
              fullWidth
              size="small"
              placeholder="Search transactions"
              aria-label="Search this consumer's transactions"
              startAdornment={
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              }
              endAdornment={
                searchValue ? (
                  <InputAdornment position="end">
                    <X
                      size={16}
                      role="button"
                      aria-label="Clear search"
                      color="var(--gray-500, #777b73)"
                      style={{ cursor: "pointer" }}
                      onClick={() => setSearchValue("")}
                    />
                  </InputAdornment>
                ) : null
              }
            />
          </div>
          <GrayButtonComponent
            title="Refresh"
            size="sm"
            func={() => setRefreshToken((token) => token + 1)}
          />
        </div>
      }
    >
      <div style={{ padding: "0 16px 12px" }}>
        <StripeTransactionTable
          searchValue={searchValue}
          triggering={refreshToken}
        />
      </div>
    </ProfileSection>
  );
};

export default TransactionsDetails;
