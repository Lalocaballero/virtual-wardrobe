import React, { useState, useEffect, useRef } from 'react';
import useWardrobeStore from '../store/wardrobeStore';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const { 
        notifications, 
        fetchNotifications, 
        markNotificationAsRead, 
        markAllNotificationsAsRead 
    } = useWardrobeStore();
    
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markNotificationAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <BellIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute mt-2 left-1/2 -translate-x-1/2 w-[95vw] max-w-md md:left-auto md:translate-x-0 md:right-0 md:w-80 md:max-w-none bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
                    <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
                        <h4 className="font-semibold">Notifications</h4>
                        {unreadCount > 0 && (
                             <button onClick={markAllNotificationsAsRead} className="text-sm text-blue-600 hover:underline">
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="text-center p-6 text-gray-500">
                                You have no new notifications.
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!n.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                >
                                    <div className="flex items-start">
                                        {!n.is_read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 mr-3 flex-shrink-0"></div>}
                                        <div className="flex-grow">
                                            <p className="text-sm">{n.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(n.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
