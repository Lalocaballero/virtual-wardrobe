import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useWardrobeStore, { API_BASE } from '../store/wardrobeStore';
import { BellIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const NotificationBell = () => {
    const navigate = useNavigate();
    const { 
        notifications, 
        fetchNotifications, 
        markNotificationAsRead, 
        markAllNotificationsAsRead 
    } = useWardrobeStore();
    
    const [isOpen, setIsOpen] = useState(false);
    const [justReceived, setJustReceived] = useState(false); // State for animation
    const dropdownRef = useRef(null);

    // Initial fetch of notifications when the component mounts.
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // This hook establishes the real-time connection to the server.
    useEffect(() => {
        const eventSource = new EventSource(`${API_BASE}/notifications/stream`, { withCredentials: true });

        // When a new notification arrives...
        eventSource.onmessage = (event) => {
            const newNotification = JSON.parse(event.data);
            console.log('New notification received:', newNotification);

            // 1. Show a toast message to the user.
            toast(newNotification.message || 'You have a new notification!');
            
            // 2. Refresh the list of notifications in the dropdown.
            fetchNotifications();

            // 3. Trigger a visual animation on the bell icon.
            setJustReceived(true);
            setTimeout(() => setJustReceived(false), 1000); // Animation duration
        };

        eventSource.onerror = (err) => {
            console.error('EventSource connection failed:', err);
            // The browser will automatically try to reconnect, so we don't need to do anything here.
        };

        // Clean up the connection when the component is unmounted.
        return () => {
            eventSource.close();
        };
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
        setIsOpen(false);
        if (notification.link) {
            navigate(notification.link);
        }
    };
    
    // Add a simple keyframe animation for the bell shake
    const animationStyle = `
        @keyframes bell-shake {
            0% { transform: rotate(0); }
            25% { transform: rotate(15deg); }
            50% { transform: rotate(-15deg); }
            75% { transform: rotate(15deg); }
            100% { transform: rotate(0); }
        }
        .animate-bell-shake {
            animation: bell-shake 0.5s ease-in-out;
        }
    `;

    return (
        <div className="relative" ref={dropdownRef}>
            <style>{animationStyle}</style>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-muted dark:hover:bg-inkwell">
                <BellIcon className={`h-6 w-6 text-slate dark:text-cloud-white ${justReceived ? 'animate-bell-shake' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-card dark:ring-dark-subtle"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute mt-2 left-1/2 -translate-x-1/2 w-[95vw] max-w-md md:left-auto md:translate-x-0 md:right-0 md:w-80 md:max-w-none bg-card dark:bg-dark-subtle rounded-lg shadow-lg border dark:border-inkwell z-50">
                    <div className="p-4 flex justify-between items-center border-b dark:border-inkwell">
                        <h4 className="font-semibold">Notifications</h4>
                        {unreadCount > 0 && (
                             <button onClick={markAllNotificationsAsRead} className="text-sm text-blue-600 hover:underline">
                                 Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="text-center p-6 text-slate">
                                You're all caught up!
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-4 border-b dark:border-inkwell hover:bg-background dark:hover:bg-inkwell cursor-pointer ${!n.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                >
                                    <div className="flex items-start">
                                        {!n.is_read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 mr-3 flex-shrink-0"></div>}
                                        <div className="flex-grow">
                                            <p className="text-sm">{n.message}</p>
                                            <p className="text-xs text-slate mt-1">
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
