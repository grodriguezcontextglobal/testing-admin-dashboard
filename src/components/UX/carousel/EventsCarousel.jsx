import { useMediaQuery } from "@uidotdev/usehooks";
import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon } from "../../icons/ChevronLeftIcon";
import { ChevronRightIcon } from "../../icons/ChevronRightIcon";
import "./EventsCarousel.css";

const ITEMS_PER_PAGE_DESKTOP = 2;
const ITEMS_PER_PAGE_MOBILE = 1;

const EventsCarousel = ({ items, renderItem }) => {
  const isSmall = useMediaQuery("only screen and (max-width : 768px)");
  const itemsPerPage = isSmall ? ITEMS_PER_PAGE_MOBILE : ITEMS_PER_PAGE_DESKTOP;

  const [currentPage, setCurrentPage] = useState(0);
  const prevItemsPerPage = useRef(itemsPerPage);

  const pages = [];
  for (let i = 0; i < items.length; i += itemsPerPage) {
    pages.push(items.slice(i, i + itemsPerPage));
  }
  const totalPages = pages.length;

  // Reset to page 0 when layout changes between mobile and desktop
  useEffect(() => {
    if (prevItemsPerPage.current !== itemsPerPage) {
      setCurrentPage(0);
      prevItemsPerPage.current = itemsPerPage;
    }
  }, [itemsPerPage]);

  const goTo = useCallback(
    (page) => {
      if (page < 0 || page >= totalPages) return;
      setCurrentPage(page);
    },
    [totalPages],
  );

  const goPrev = () => goTo(currentPage - 1);
  const goNext = () => goTo(currentPage + 1);

  if (!items || items.length === 0) return null;

  return (
    <div className="events-carousel">
      <div className="events-carousel__viewport">
        <div
          className="events-carousel__track"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {pages.map((pageItems, pageIndex) => (
            <div key={pageIndex} className="events-carousel__page">
              {pageItems.map((item, itemIndex) => (
                <div key={item.id ?? itemIndex} className="events-carousel__item">
                  {renderItem(item)}
                </div>
              ))}
              {/* Fill empty slot on last page to keep layout stable */}
              {pageItems.length < itemsPerPage &&
                Array.from({ length: itemsPerPage - pageItems.length }).map(
                  (_, i) => (
                    <div key={`empty-${i}`} className="events-carousel__item" />
                  ),
                )}
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="events-carousel__footer">
          <span className="events-carousel__counter">
            {currentPage + 1} / {totalPages}
          </span>

          <div className="events-carousel__dots">
            {pages.map((_, i) => (
              <button
                key={i}
                aria-label={`Ir a página ${i + 1}`}
                className={[
                  "events-carousel__dot",
                  i === currentPage ? "events-carousel__dot--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => goTo(i)}
              />
            ))}
          </div>

          <div className="events-carousel__nav">
            <button
              className="events-carousel__btn"
              onClick={goPrev}
              disabled={currentPage === 0}
              aria-label="Anterior"
            >
              <ChevronLeftIcon />
            </button>
            <button
              className="events-carousel__btn"
              onClick={goNext}
              disabled={currentPage === totalPages - 1}
              aria-label="Siguiente"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

EventsCarousel.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
};

export default EventsCarousel;