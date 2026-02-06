import React from "react";
import "../../../styles/timetable.css";

export default function TimeTable() {
    return (
        <div className="support-timetable-container">
            <div className="support-timetable-header">
                <h1>🎬 CINEMA ACTIVITY SCHEDULE</h1>
                <p>Smart Work Shift Management System - Week from Monday to Sunday</p>
            </div>

            <div className="support-schedule-container">
                {/* WEEKDAYS */}
                <div className="support-schedule-card">
                    <div className="support-schedule-title support-weekday-title">
                        <span className="support-schedule-icon">📅</span>
                        <span>WEEKDAYS (Monday - Friday)</span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Shift</th>
                                <th>Time</th>
                                <th>Hours</th>
                                <th>Staff</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="support-shift-name">🌅 Early Morning</td>
                                <td className="support-shift-time">06:00 - 10:00</td>
                                <td><span className="support-shift-duration">4 hours</span></td>
                                <td><span className="support-shift-staff">2 people</span></td>
                            </tr>
                            <tr>
                                <td className="support-shift-name">☀️ Morning</td>
                                <td className="support-shift-time">08:00 - 12:00</td>
                                <td><span className="support-shift-duration">4 hours</span></td>
                                <td><span className="support-shift-staff">2 people</span></td>
                            </tr>
                            <tr>
                                <td className="support-shift-name">🕐 Noon</td>
                                <td className="support-shift-time">12:00 - 16:00</td>
                                <td><span className="support-shift-duration">4 hours</span></td>
                                <td><span className="support-shift-staff">2 people</span></td>
                            </tr>
                            <tr>
                                <td className="support-shift-name">🌤️ Afternoon</td>
                                <td className="support-shift-time">14:00 - 18:00</td>
                                <td><span className="support-shift-duration">4 hours</span></td>
                                <td><span className="support-shift-staff">2 people</span></td>
                            </tr>
                            <tr>
                                <td className="support-shift-name">🌙 Evening</td>
                                <td className="support-shift-time">18:00 - 22:00</td>
                                <td><span className="support-shift-duration">4 hours</span></td>
                                <td><span className="support-shift-staff">2 people</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* WEEKENDS */}
                <div className="support-schedule-card">
                    <div className="support-schedule-title support-weekend-title">
                        <span className="support-schedule-icon">🎉</span>
                        <span>WEEKENDS (Saturday - Sunday)</span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Shift</th>
                                <th>Time</th>
                                <th>Hours</th>
                                <th>Staff</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="support-shift-name">🌅 Morning</td>
                                <td className="support-shift-time">07:00 - 14:00</td>
                                <td><span className="support-shift-duration support-weekend-duration">7 hours</span></td>
                                <td><span className="support-shift-staff">3 people</span></td>
                            </tr>
                            <tr>
                                <td className="support-shift-name">🌤️ Afternoon</td>
                                <td className="support-shift-time">14:00 - 21:00</td>
                                <td><span className="support-shift-duration support-weekend-duration">7 hours</span></td>
                                <td><span className="support-shift-staff">3 people</span></td>
                            </tr>
                            <tr>
                                <td className="support-shift-name">📅 Long Shift</td>
                                <td className="support-shift-time">08:00 - 17:00</td>
                                <td><span className="support-shift-duration support-weekend-duration">9 hours</span></td>
                                <td><span className="support-shift-staff">3 people</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* STATISTICS */}
            <div className="support-summary-card">
                <div className="support-summary-title">📊 Overall Statistics</div>
                
                <div className="support-stats-grid">
                    <div className="support-stat-box">
                        <div className="support-stat-value">28</div>
                        <div className="support-stat-label">Total Shifts / Week</div>
                    </div>
                    <div className="support-stat-box">
                        <div className="support-stat-value">25</div>
                        <div className="support-stat-label">Weekday Shifts</div>
                    </div>
                    <div className="support-stat-box">
                        <div className="support-stat-value">6</div>
                        <div className="support-stat-label">Weekend Shifts</div>
                    </div>
                    <div className="support-stat-box">
                        <div className="support-stat-value">20</div>
                        <div className="support-stat-label">Employees</div>
                    </div>
                </div>

                <div className="support-timeline">
                    <div className="support-timeline-title">⏰ Daily Activity Timeline</div>
                    
                    <p className="support-timeline-label support-weekday-label">Weekdays:</p>
                    <div className="support-timeline-bar">
                        <div className="support-time-slot support-weekday-slot" style={{ width: '25%' }}>
                            06:00-10:00<br />Early Morning
                        </div>
                        <div className="support-time-slot support-weekday-slot" style={{ width: '25%' }}>
                            08:00-12:00<br />Morning
                        </div>
                        <div className="support-time-slot support-weekday-slot" style={{ width: '25%' }}>
                            12:00-16:00<br />Noon
                        </div>
                        <div className="support-time-slot support-weekday-slot" style={{ width: '25%' }}>
                            14:00-18:00<br />Afternoon
                        </div>
                        <div className="support-time-slot support-weekday-slot" style={{ width: '25%' }}>
                            18:00-22:00<br />Evening
                        </div>
                    </div>

                    <p className="support-timeline-label support-weekend-label">Weekends:</p>
                    <div className="support-timeline-bar">
                        <div className="support-time-slot support-weekend-slot" style={{ width: '33.33%' }}>
                            07:00-14:00<br />Morning (7h)
                        </div>
                        <div className="support-time-slot support-weekend-slot" style={{ width: '33.33%' }}>
                            08:00-17:00<br />Long Shift (9h)
                        </div>
                        <div className="support-time-slot support-weekend-slot" style={{ width: '33.33%' }}>
                            14:00-21:00<br />Afternoon (7h)
                        </div>
                    </div>

                    <div className="support-legend">
                        <div className="support-legend-item">
                            <div className="support-legend-color support-weekday-color"></div>
                            <span>Weekdays (4h/shift, 2 people)</span>
                        </div>
                        <div className="support-legend-item">
                            <div className="support-legend-color support-weekend-color"></div>
                            <span>Weekends (7-9h/shift, 3 people)</span>
                        </div>
                    </div>
                </div>

                <div className="support-rules-box">
                    <h3>⚖️ Shift Assignment Rules</h3>
                    <ul>
                        <li><strong>Maximum:</strong> 6 shifts/week/employee</li>
                        <li><strong>Hour limit:</strong> 40 hours/week</li>
                        <li><strong>Rest period:</strong> At least 12 hours between shifts</li>
                        <li><strong>Consecutive work:</strong> Maximum 5 consecutive days</li>
                        <li><strong>Weekends:</strong> Priority for long shifts (7-9 hours) with 3 people/shift</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}