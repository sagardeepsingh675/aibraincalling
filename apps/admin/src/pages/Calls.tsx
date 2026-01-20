function Calls() {
    const calls = [
        { id: 1, leadName: 'Rahul Kumar', phone: '9876543210', date: '2024-01-19 14:30', duration: '4:12', status: 'completed', hasRecording: true },
        { id: 2, leadName: 'Priya Singh', phone: '8765432109', date: '2024-01-19 13:15', duration: '2:30', status: 'in_progress', hasRecording: false },
        { id: 3, leadName: 'Amit Sharma', phone: '7654321098', date: '2024-01-19 12:00', duration: '0:45', status: 'failed', hasRecording: true },
    ];

    return (
        <div className="calls-page">
            <div className="page-header">
                <h1 className="page-title">Call History</h1>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Lead</th>
                            <th>Phone</th>
                            <th>Date/Time</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Recording</th>
                        </tr>
                    </thead>
                    <tbody>
                        {calls.map((call) => (
                            <tr key={call.id}>
                                <td>{call.leadName}</td>
                                <td>{call.phone}</td>
                                <td>{call.date}</td>
                                <td>{call.duration}</td>
                                <td>
                                    <span className={`badge badge-${call.status === 'completed' ? 'success' : call.status === 'in_progress' ? 'warning' : 'error'}`}>
                                        {call.status}
                                    </span>
                                </td>
                                <td>
                                    {call.hasRecording ? (
                                        <button className="btn-icon">▶️ Play</button>
                                    ) : (
                                        <span className="no-recording">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
        .no-recording {
          color: var(--text-muted);
        }
      `}</style>
        </div>
    );
}

export default Calls;
