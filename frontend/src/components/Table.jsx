import './Table.css';

/**
 * Reusable Table component
 * ------------------------
 * Props:
 * - columns: [{ label: string, accessor: string }]
 * - data: array of objects
 * - loading: boolean
 * - error: string | null
 * - page: number
 * - limit: number
 * - totalCount: number
 * - onPageChange: fn(newPage)
 * - onLimitChange: fn(newLimit)
 * - renderRow: optional custom row renderer
 */
function Table({
    columns,
    data,
    loading,
    error,
    page,
    limit,
    totalCount,
    onPageChange,
    onLimitChange,
    renderRow
}) {
    const totalPages = Math.ceil(totalCount / limit);

    return (
        <div className='table-container'>

            {/* TABLE HEADER */}
            <table className='table'>
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th key={col.accessor}>{col.label}</th>
                        ))}
                    </tr>
                </thead>

                {/* TABLE BODY */}
                <tbody>
                    {/* Loading State */}
                    {loading && (
                        <tr>
                            <td colSpan={columns.length}>Loading...</td>
                        </tr>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <tr>
                            <td colSpan={columns.length} className='error-message'>
                                {error}
                            </td>
                        </tr>
                    )}

                    {/* Empty State */}
                    {!loading && !error && data.length === 0 && (
                        <tr>
                            <td colSpan={columns.length}>No results found.</td>
                        </tr>
                    )}

                    {/* Render actual data */}
                    {!loading && !error && data.length > 0 && (
                        <>
                            {renderRow
                                ? data.map(renderRow)
                                : data.map((row, index) => (
                                    <tr key={index}>
                                        {columns.map(col => (
                                            <td key={col.accessor}>
                                                {
                                                    typeof col.accessor === 'function'
                                                    ? col.accessor(row)
                                                    : row[col.accessor]
                                                }
                                            </td>
                                        ))}
                                    </tr>
                                  ))}
                        </>
                    )}
                </tbody>
            </table>

            {/* PAGINATION BAR */}
            <div className='pagination-bar'>
                <button
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    Previous
                </button>

                <span>
                    Page {page} / {totalPages || 1}
                </span>

                <button
                    disabled={page === totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </button>

                {/* LIMIT SELECTOR */}
                <select
                    value={limit}
                    onChange={e => onLimitChange(Number(e.target.value))}
                >
                    <option value='10'>10 per page</option>
                    <option value='20'>20 per page</option>
                    <option value='50'>50 per page</option>
                    <option value='100'>100 per page</option>
                </select>
            </div>
        </div>
    );
}

export default Table;
