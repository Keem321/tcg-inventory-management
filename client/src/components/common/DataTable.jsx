/**
 * Reusable DataTable Component
 * Provides consistent table styling with search, filtering, and pagination support
 */
import { Table, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useState } from "react";
import { useDebounce } from "../../hooks";

function DataTable({
	data = [],
	columns = [],
	loading = false,
	error = null,
	searchable = true,
	searchPlaceholder = "Search...",
	searchValue = null, // Controlled search value from parent
	onSearchChange = null, // Callback when search changes
	customFilter = null, // Custom filter function from parent
	filters = null, // Custom filter components
	emptyMessage = "No data available",
	striped = true,
	hover = true,
	responsive = true,
	renderRow = null, // Custom row renderer
	headerActions = null, // Actions to show in header (e.g., Add button)
	itemCount = null, // Optional item count for header
}) {
	const [internalSearchTerm, setInternalSearchTerm] = useState("");

	// Use controlled or internal search
	const searchTerm = searchValue !== null ? searchValue : internalSearchTerm;
	const debouncedSearch = useDebounce(searchTerm, 300, 2);

	// Filter data based on search term or custom filter
	const filteredData = customFilter
		? data.filter(customFilter)
		: data.filter((item) => {
				if (!debouncedSearch) return true;

				const search = debouncedSearch.toLowerCase();

				// Search across all searchable columns
				return columns.some((column) => {
					if (column.searchable === false) return false;

					const value = column.accessor
						? column.accessor(item)
						: item[column.key];

					return String(value || "")
						.toLowerCase()
						.includes(search);
				});
		  });

	const handleSearchChange = (e) => {
		const value = e.target.value;
		if (onSearchChange) {
			onSearchChange(value);
		} else {
			setInternalSearchTerm(value);
		}
	};

	return (
		<>
			{/* Header with optional actions */}
			{(headerActions || itemCount !== null) && (
				<div className="d-flex justify-content-between align-items-center mb-3">
					{itemCount !== null && (
						<h5 className="mb-0">
							{emptyMessage.replace("No data available", `Items`)} (
							{itemCount !== undefined ? itemCount : filteredData.length})
						</h5>
					)}
					{headerActions}
				</div>
			)}

			{/* Search and Filters Row */}
			{(searchable || filters) && (
				<Row className="mb-3">
					{searchable && (
						<Col md={filters ? 6 : 12}>
							<Form.Group>
								<Form.Label>Search</Form.Label>
								<Form.Control
									type="text"
									placeholder={searchPlaceholder}
									value={searchTerm}
									onChange={handleSearchChange}
								/>
								{searchTerm.length > 0 && searchTerm.length < 2 && (
									<Form.Text className="text-muted">
										Enter at least 2 characters to search
									</Form.Text>
								)}
							</Form.Group>
						</Col>
					)}
					{filters && <Col md={searchable ? 6 : 12}>{filters}</Col>}
				</Row>
			)}

			{/* Loading State */}
			{loading && (
				<div className="text-center py-5">
					<Spinner animation="border" role="status">
						<span className="visually-hidden">Loading...</span>
					</Spinner>
				</div>
			)}

			{/* Error State */}
			{error && (
				<Alert variant="danger">
					<strong>Error:</strong> {error}
				</Alert>
			)}

			{/* Table */}
			{!loading && !error && (
				<>
					{filteredData.length === 0 ? (
						<Alert variant="info">
							{emptyMessage}
							{searchTerm && " Try adjusting your search criteria."}
						</Alert>
					) : (
						<div className={responsive ? "table-responsive" : ""}>
							<Table striped={striped} hover={hover} className="align-middle">
								<thead>
									<tr>
										{columns.map((column, idx) => (
											<th key={idx} style={column.headerStyle}>
												{column.header}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{renderRow
										? filteredData.map((item, idx) => renderRow(item, idx))
										: filteredData.map((item, rowIdx) => (
												<tr key={item.id || item._id || rowIdx}>
													{columns.map((column, colIdx) => (
														<td key={colIdx} style={column.cellStyle}>
															{column.render
																? column.render(item)
																: column.accessor
																? column.accessor(item)
																: item[column.key]}
														</td>
													))}
												</tr>
										  ))}
								</tbody>
							</Table>
						</div>
					)}
				</>
			)}
		</>
	);
}

export default DataTable;
