import React, { useState } from 'react';
import ApplicationList from '../components/ApplicationList';
import ApplicationForm from '../components/ApplicationForm';

const Applications = ({
    applications,
    isFormOpen,
    editingApp,
    onAddNew,
    onSave,
    onCancel,
    onEdit,
    onDelete
}) => {
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterType, setFilterType] = useState("All");

    // Filter Logic
    const filteredApps = applications.filter(app => {
        const statusMatch = filterStatus === "All" || app.status === filterStatus;
        const typeMatch = filterType === "All" || app.type === filterType;
        return statusMatch && typeMatch;
    });

    // Sort by deadline (urgent first)
    const sortedApps = [...filteredApps].sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
    });

    return (
        <div className="animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
                <div>
                    <h1>Applications</h1>
                    <p className="text-muted">Manage all your job & internship applications.</p>
                </div>
                {!isFormOpen && (
                    <button onClick={onAddNew} className="btn btn-primary">
                        + New Application
                    </button>
                )}
            </header>

            {isFormOpen ? (
                <ApplicationForm
                    onSave={onSave}
                    onCancel={onCancel}
                    initialData={editingApp}
                />
            ) : (
                <>
                    {/* Filters */}
                    <div className="glass-panel p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="font-semibold text-main">
                            Showing {sortedApps.length} Application{sortedApps.length !== 1 && 's'}
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                            <select
                                className="form-select"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="All">All Types</option>
                                <option value="Internship">Internship</option>
                                <option value="Job">Job / Full-time</option>
                                <option value="Hackathon">Hackathon</option>
                                <option value="Program">Program</option>
                            </select>

                            <select
                                className="form-select"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Applied">Applied</option>
                                <option value="Interview">Interview</option>
                                <option value="Offer">Offer</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    <ApplicationList
                        applications={sortedApps}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </>
            )}
        </div>
    );
};

export default Applications;
