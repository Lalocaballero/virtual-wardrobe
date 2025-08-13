import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import UserList from './UserList';
import UserDetails from './UserDetails';
import AdminStats from './AdminStats';
import AdminActionLog from './AdminActionLog';

const AdminDashboard = () => {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            <nav className="flex space-x-4 mb-4">
                <NavLink to="/admin/stats" className={({ isActive }) => isActive ? "text-blue-500" : ""}>Stats</NavLink>
                <NavLink to="/admin/users" className={({ isActive }) => isActive ? "text-blue-500" : ""}>Users</NavLink>
                <NavLink to="/admin/log" className={({ isActive }) => isActive ? "text-blue-500" : ""}>Action Log</NavLink>
            </nav>
            <Routes>
                <Route path="/" element={<Navigate to="stats" />} />
                <Route path="stats" element={<AdminStats />} />
                <Route path="users" element={<UserList />} />
                <Route path="users/:userId" element={<UserDetails />} />
                <Route path="log" element={<AdminActionLog />} />
            </Routes>
        </div>
    );
};

export default AdminDashboard;
