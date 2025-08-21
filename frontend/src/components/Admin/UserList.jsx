import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { useNavigate } from 'react-router-dom';
import useWardrobeStore from '../../store/wardrobeStore';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageCount, setPageCount] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [emailFilter, setEmailFilter] = useState('');
    const { fetchApi } = useWardrobeStore();
    const navigate = useNavigate();

    const columns = useMemo(() => [
        { Header: 'ID', accessor: 'id' },
        { Header: 'Email', accessor: 'email' },
        { Header: 'Premium', accessor: 'is_premium', Cell: ({ value }) => (value ? 'Yes' : 'No') },
        { Header: 'Verified', accessor: 'is_verified', Cell: ({ value }) => (value ? 'Yes' : 'No') },
        { Header: 'Created At', accessor: 'created_at', Cell: ({ value }) => value ? new Date(value).toLocaleDateString() : 'N/A' },
    ], []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        page,
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount: controlledPageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize, sortBy },
    } = useTable(
        {
            columns,
            data: users,
            initialState: { pageIndex: 0, pageSize: 10 },
            manualPagination: true,
            manualSortBy: true,
            pageCount: pageCount,
        },
        useSortBy,
        usePagination
    );

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const params = new URLSearchParams({
                page: pageIndex + 1,
                per_page: pageSize,
                sort_by: sortBy[0]?.id || 'created_at',
                sort_direction: sortBy[0]?.desc ? 'desc' : 'asc',
            });
            if (emailFilter) {
                params.append('email', emailFilter);
            }

            try {
                const data = await fetchApi(`/api/admin/users?${params.toString()}`);
                setUsers(data.users);
                setPageCount(data.pages);
                setTotalUsers(data.total);
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [fetchApi, pageIndex, pageSize, sortBy, emailFilter]);

    return (
        <div className="container mx-auto p-4">
            <div className="mb-4">
                <input
                    value={emailFilter}
                    onChange={e => setEmailFilter(e.target.value)}
                    placeholder={"Search by email..."}
                    className="p-2 border border-gray-300 rounded"
                />
            </div>
            <table {...getTableProps()} className="min-w-full bg-white">
                <thead>
                    {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                    {column.render('Header')}
                                    <span>
                                        {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {page.map(row => {
                        prepareRow(row);
                        return (
                            <tr {...row.getRowProps()} onClick={() => navigate(`/admin/users/${row.original.id}`)} className="cursor-pointer hover:bg-gray-100">
                                {row.cells.map(cell => (
                                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="pagination">
                <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>{'<<'}</button>
                <button onClick={() => previousPage()} disabled={!canPreviousPage}>{'<'}</button>
                <button onClick={() => nextPage()} disabled={!canNextPage}>{'>'}</button>
                <button onClick={() => gotoPage(controlledPageCount - 1)} disabled={!canNextPage}>{'>>'}</button>
                <span>Page <strong>{pageIndex + 1} of {pageOptions.length}</strong></span>
                <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                    {[10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>Show {pageSize}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default UserList;
