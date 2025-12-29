import { useEffect, useState } from 'react';
import { fetchReports } from '../../api/admin-api';

const Reports = () => {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetchReports().then(setReports);
  }, []);

  return (
    <div>
      <h2>Reports</h2>
      {reports.map((r) => (
        <div key={r._id}>
          {r.reason} — {r.status}
        </div>
      ))}
    </div>
  );
};

export default Reports;
