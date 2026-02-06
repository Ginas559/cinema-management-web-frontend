import React, { useState, useEffect } from 'react';
import {
    useDashboard,
    useOccupancy,
    useGenres,
    useRevenue
} from '../hooks/useAnalytics';
import {
    Download,
    Calendar,
    TrendingUp,
    Users,
    Film,
    DollarSign,
    Percent,
    BarChart3,
    ArrowUp,
    ArrowDown,
    Star,
    Award,
    Activity,
    Ticket,
    FileDown
} from 'lucide-react';
import '../styles/report-stat.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportStat = () => {
    const [startDate, setStartDate] = useState('2024-01-01');
    const [endDate, setEndDate] = useState('2026-12-31');
    const [exportingSection, setExportingSection] = useState(null);

    // Fetch data with defensive defaults
    const dashboard = useDashboard(startDate, endDate) || { overview: {}, timeseries: [], loading: false };
    const occupancy = useOccupancy(startDate, endDate) || { timeslots: [], rooms: [], loading: false };
    const genres = useGenres(startDate, endDate, 5) || { statistics: [], topMovies: [], loading: false };
    const revenue = useRevenue(startDate, endDate) || { movies: [], loading: false };

    const isLoading = dashboard.loading || occupancy.loading || genres.loading || revenue.loading;

    // Export specific section to PDF
    const exportSectionToPDF = async (sectionId, sectionName) => {
        setExportingSection(sectionId);
        try {
            const element = document.getElementById(sectionId);
            if (!element) {
                console.error(`Section ${sectionId} not found`);
                return;
            }

            // Add exporting class for styling
            element.classList.add('exporting');

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            const pageHeight = pdf.internal.pageSize.getHeight();

            let heightLeft = pdfHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            // Add additional pages if needed
            while (heightLeft > 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${sectionName}-${startDate}-to-${endDate}.pdf`);
            element.classList.remove('exporting');
        } catch (error) {
            console.error('PDF export failed:', error);
        } finally {
            setExportingSection(null);
        }
    };

    // Export all data to JSON
    const handleExportJSON = () => {
        const data = {
            reportInfo: {
                generatedAt: new Date().toISOString(),
                startDate,
                endDate,
                reportType: 'Cinema Analytics'
            },
            dashboard: {
                overview: dashboard.overview,
                timeseries: dashboard.timeseries
            },
            occupancy: {
                timeslots: occupancy.timeslots,
                rooms: occupancy.rooms
            },
            genres: {
                statistics: genres.statistics,
                topMovies: genres.topMovies
            },
            revenue: {
                movies: revenue.movies
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cinema-analytics-${startDate}-to-${endDate}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value || 0);
    };

    const formatNumber = (value) => {
        return new Intl.NumberFormat('en-US').format(value || 0);
    };

    const formatPercent = (value) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    const StatCard = ({ icon: Icon, title, value, subtitle, trend, color }) => (
        <div className="report-stat-card">
            <div className="report-stat-card-icon" style={{ background: color }}>
                <Icon size={24} />
            </div>
            <div className="report-stat-card-content">
                <div className="report-stat-card-title">{title}</div>
                <div className="report-stat-card-value">{value}</div>
                {subtitle && <div className="report-stat-card-subtitle">{subtitle}</div>}
                {trend !== undefined && (
                    <div className={`report-stat-card-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
                        {trend >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        {Math.abs(trend).toFixed(1)}%
                    </div>
                )}
            </div>
        </div>
    );

    const SimpleBarChart = ({ data, dataKey, labelKey, color, maxHeight = 100 }) => {
        if (!data || data.length === 0) {
            return <p className="report-stat-empty">No data available</p>;
        }

        const maxValue = Math.max(...data.map(d => d[dataKey] || 0));

        return (
            <div className="report-stat-chart">
                {data.slice(0, 10).map((item, idx) => {
                    const height = maxValue > 0 ? (item[dataKey] / maxValue) * maxHeight : 0;
                    return (
                        <div key={idx} className="report-stat-chart-bar-container">
                            <div
                                className="report-stat-chart-bar"
                                style={{
                                    height: `${height}px`,
                                    background: color
                                }}
                            >
                                <span className="report-stat-chart-value">{formatNumber(item[dataKey])}</span>
                            </div>
                            <div className="report-stat-chart-label">{item[labelKey]}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const DataTable = ({ columns, data, maxRows = 10 }) => {
        if (!data || data.length === 0) {
            return <p className="report-stat-empty">No data available</p>;
        }

        return (
            <div className="report-stat-table-container">
                <table className="report-stat-table">
                    <thead>
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx}>{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, maxRows).map((row, idx) => (
                            <tr key={idx}>
                                {columns.map((col, colIdx) => {
                                    const value = row[col.key];
                                    return (
                                        <td key={colIdx}>
                                            {col.render ? col.render(value, row) : value}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const SectionHeader = ({ icon: Icon, title, sectionId, sectionName }) => (
        <div className="report-stat-section-header">
            <h2 className="report-stat-section-title">
                <Icon size={20} />
                {title}
            </h2>
            <button
                className="report-stat-export-section-btn"
                onClick={() => exportSectionToPDF(sectionId, sectionName)}
                disabled={exportingSection === sectionId}
            >
                {exportingSection === sectionId ? (
                    <>
                        <Activity size={14} className="spinning" />
                        Exporting...
                    </>
                ) : (
                    <>
                        <FileDown size={14} />
                        Export PDF
                    </>
                )}
            </button>
        </div>
    );

    if (isLoading) {
        return (
            <div className="report-stat-container">
                <div className="report-stat-loading">
                    <Activity size={48} className="report-stat-spinner" />
                    <p>Loading analytics data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="report-stat-container">
            {/* Header */}
            <div className="report-stat-header">
                <div className="report-stat-header-title">
                    <BarChart3 size={32} />
                    <h1>Cinema Analytics Dashboard</h1>
                </div>
                <div className="report-stat-header-controls">
                    <div className="report-stat-date-picker">
                        <Calendar size={16} />
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                        <span>to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                    <button className="report-stat-export-btn" onClick={handleExportJSON}>
                        <Download size={16} />
                        Export All Data (JSON)
                    </button>
                </div>
            </div>

            {/* Overview Section */}
            <div className="report-stat-section" id="overview-section">
                <SectionHeader
                    icon={TrendingUp}
                    title="Performance Overview"
                    sectionId="overview-section"
                    sectionName="performance-overview"
                />
                <div className="report-stat-section-content">
                    <div className="report-stat-grid">
                        <StatCard
                            icon={DollarSign}
                            title="Total Revenue"
                            value={formatCurrency(dashboard.overview?.total_revenue)}
                            subtitle={`${formatNumber(dashboard.overview?.total_bookings)} bookings`}
                            color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        />
                        <StatCard
                            icon={Ticket}
                            title="Tickets Sold"
                            value={formatNumber(dashboard.overview?.total_tickets_sold)}
                            subtitle={`Avg: ${formatCurrency(dashboard.overview?.avg_booking_value)}`}
                            color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                        />
                        <StatCard
                            icon={Film}
                            title="Total Showtimes"
                            value={formatNumber(dashboard.overview?.total_showtimes)}
                            subtitle={`${formatNumber(dashboard.overview?.total_movies_shown)} movies`}
                            color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                        />
                        <StatCard
                            icon={Users}
                            title="Unique Customers"
                            value={formatNumber(dashboard.overview?.unique_customers)}
                            subtitle="Active users"
                            color="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                        />
                    </div>
                </div>
            </div>

            {/* Revenue Trend Section */}
            <div className="report-stat-section" id="revenue-trend-section">
                <SectionHeader
                    icon={Activity}
                    title="Revenue Trend"
                    sectionId="revenue-trend-section"
                    sectionName="revenue-trend"
                />
                <div className="report-stat-section-content">
                    <div className="report-stat-chart-wrapper">
                        <SimpleBarChart
                            data={dashboard.timeseries || []}
                            dataKey="revenue"
                            labelKey="date"
                            color="linear-gradient(180deg, #667eea 0%, #764ba2 100%)"
                            maxHeight={150}
                        />
                    </div>
                </div>
            </div>

            {/* Occupancy Section */}
            <div className="report-stat-section" id="occupancy-section">
                <SectionHeader
                    icon={Percent}
                    title="Occupancy Analysis"
                    sectionId="occupancy-section"
                    sectionName="occupancy-analysis"
                />
                <div className="report-stat-section-content">
                    <div className="report-stat-subsection">
                        <h3>By Time Slot</h3>
                        <SimpleBarChart
                            data={occupancy.timeslots || []}
                            dataKey="occupancy_rate"
                            labelKey="time_slot"
                            color="linear-gradient(180deg, #4facfe 0%, #00f2fe 100%)"
                            maxHeight={120}
                        />
                    </div>

                    <div className="report-stat-subsection">
                        <h3>Top Performing Rooms</h3>
                        <DataTable
                            columns={[
                                { key: 'name', label: 'Room' },
                                { key: 'total_showtimes', label: 'Showtimes', render: v => formatNumber(v) },
                                { key: 'avg_occupancy_rate', label: 'Avg Occupancy', render: v => formatPercent(v) },
                                { key: 'total_tickets_sold', label: 'Tickets Sold', render: v => formatNumber(v) }
                            ]}
                            data={occupancy.rooms || []}
                            maxRows={5}
                        />
                    </div>
                </div>
            </div>

            {/* Genre Performance Section */}
            <div className="report-stat-section" id="genre-section">
                <SectionHeader
                    icon={Star}
                    title="Genre Performance"
                    sectionId="genre-section"
                    sectionName="genre-performance"
                />
                <div className="report-stat-section-content">
                    <div className="report-stat-subsection">
                        <h3>Revenue by Genre</h3>
                        <SimpleBarChart
                            data={genres.statistics || []}
                            dataKey="total_revenue"
                            labelKey="genre"
                            color="linear-gradient(180deg, #f093fb 0%, #f5576c 100%)"
                            maxHeight={120}
                        />
                    </div>

                    <div className="report-stat-subsection">
                        <h3>Top Movies</h3>
                        <DataTable
                            columns={[
                                { key: 'title', label: 'Movie' },
                                { key: 'genre', label: 'Genre', render: v => v || 'N/A' },
                                { key: 'booking_count', label: 'Bookings', render: v => formatNumber(v) },
                                { key: 'revenue', label: 'Revenue', render: v => formatCurrency(v) },
                                { key: 'rating', label: 'Rating', render: v => `⭐ ${v || 'N/A'}` }
                            ]}
                            data={genres.topMovies || []}
                            maxRows={8}
                        />
                    </div>
                </div>
            </div>

            {/* Movie Revenue Section */}
            <div className="report-stat-section" id="movie-revenue-section">
                <SectionHeader
                    icon={Award}
                    title="Movie Revenue Analysis"
                    sectionId="movie-revenue-section"
                    sectionName="movie-revenue-analysis"
                />
                <div className="report-stat-section-content">
                    <div className="report-stat-subsection">
                        <h3>Top Grossing Movies</h3>
                        <DataTable
                            columns={[
                                { key: 'title', label: 'Movie Title' },
                                {
                                    key: 'genres',
                                    label: 'Genres',
                                    render: v =>
                                        v
                                            ? Array.from(new Set(v.split(',').map(g => g.trim()))).join(', ')
                                            : 'N/A'
                                },
                                { key: 'total_showtimes', label: 'Shows', render: v => formatNumber(v) },
                                { key: 'total_tickets_sold', label: 'Tickets', render: v => formatNumber(v) },
                                { key: 'total_revenue', label: 'Revenue', render: v => formatCurrency(v) },
                                { key: 'avg_ticket_price', label: 'Avg Price', render: v => formatCurrency(v) }
                            ]}
                            data={revenue.movies || []}
                            maxRows={10}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportStat;