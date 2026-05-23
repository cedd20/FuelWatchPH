import { ChevronLeft, ChevronRight } from "lucide-react";

export function TablePagination({
  currentPage,
  totalItems,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) {
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="admin-surface border-t-2 border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/50 px-4 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Rows per page selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="px-3 py-2 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-sm font-bold text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer hover:border-emerald-400"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">
            {startItem}–{endItem} of {totalItems}
          </span>
        </div>

        {/* Right: Pagination controls */}
        <div className="flex items-center gap-2">
          {/* Previous button */}
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-sm text-foreground hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white dark:disabled:hover:bg-neutral-800 dark:disabled:hover:border-neutral-700 flex items-center gap-1"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-2 text-sm font-bold text-muted-foreground"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = page;
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                      : "bg-white dark:bg-neutral-800 text-foreground border-2 border-gray-200 dark:border-neutral-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                  }`}
                  aria-label={`Page ${pageNum}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-2 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-sm text-foreground hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white dark:disabled:hover:bg-neutral-800 dark:disabled:hover:border-neutral-700 flex items-center gap-1"
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
