import PropTypes from "prop-types";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./CardsCarousel.css";

/** Cards per page unless the caller says otherwise. */
export const CARDS_PER_PAGE = 12;

/* Set on the icon itself, not inherited: the global `button` rules (index.css,
   and checkoutStyles.css's white text once Stripe's page has loaded) would
   otherwise decide its colour. */
const ICON_COLOR = "var(--gray-700, #344054)";

/** Past this many pages the dots stop fitting; the counter says it alone. */
const MAX_DOTS = 10;

/**
 * A wrapping grid of cards, a page at a time.
 *
 * For lists that grow with the company's data — the inventory filter panel's
 * categories, groups, brands and ownership — where showing every card at once
 * stretched the page past the table it sits above. EventsCarousel is the
 * other one: two event cards side by side, a different layout.
 *
 * Only the current page is rendered. The page is clamped on every render, so a
 * list that shrinks under it (a search, a refetch) lands on its last page
 * instead of an empty one.
 */
const CardsCarousel = ({ items, renderItem, getKey, pageSize = CARDS_PER_PAGE, label }) => {
  const [requestedPage, setRequestedPage] = useState(0);

  const list = Array.isArray(items) ? items : [];
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const page = Math.min(requestedPage, totalPages - 1);
  const visible = list.slice(page * pageSize, (page + 1) * pageSize);

  if (list.length === 0) return null;

  const goTo = (next) => {
    if (next < 0 || next >= totalPages) return;
    setRequestedPage(next);
  };

  return (
    <section className="cards-carousel" aria-label={label}>
      <div className="cards-carousel__page">
        {visible.map((item, index) => (
          <div
            key={getKey ? getKey(item) : page * pageSize + index}
            className="cards-carousel__item"
          >
            {renderItem(item)}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="cards-carousel__footer">
          <span className="cards-carousel__counter">
            {page + 1} / {totalPages}
          </span>

          {totalPages <= MAX_DOTS && (
            <div className="cards-carousel__dots">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to page ${i + 1}`}
                  aria-current={i === page ? "page" : undefined}
                  className={[
                    "cards-carousel__dot",
                    i === page ? "cards-carousel__dot--active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          )}

          <div className="cards-carousel__nav">
            <button
              type="button"
              className="cards-carousel__btn"
              onClick={() => goTo(page - 1)}
              disabled={page === 0}
              aria-label="Previous cards"
            >
              <ChevronLeft size={20} color={ICON_COLOR} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="cards-carousel__btn"
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages - 1}
              aria-label="Next cards"
            >
              <ChevronRight size={20} color={ICON_COLOR} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

CardsCarousel.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  getKey: PropTypes.func,
  pageSize: PropTypes.number,
  label: PropTypes.string,
};

export default CardsCarousel;
