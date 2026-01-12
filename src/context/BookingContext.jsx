import { createContext, useContext, useState, useEffect } from "react";
import { roomData } from "../db/data";

const BookingInfo = createContext();

export const BookingContext = ({ children }) => {
  const [bookings, setBookings] = useState([]);

  // Load bookings from localStorage on mount
  useEffect(() => {
    const savedBookings = localStorage.getItem('hotelBookings');
    if (savedBookings) {
      try {
        setBookings(JSON.parse(savedBookings));
      } catch (error) {
        console.error('Error loading bookings:', error);
      }
    }
  }, []);

  // Save bookings to localStorage whenever bookings change
  useEffect(() => {
    localStorage.setItem('hotelBookings', JSON.stringify(bookings));
  }, [bookings]);

  // Add a new booking
  const addBooking = (bookingData) => {
    const newBooking = {
      id: Date.now().toString(),
      ...bookingData,
      createdAt: new Date().toISOString(),
      status: 'confirmed'
    };
    setBookings(prev => [newBooking, ...prev]);
    return newBooking;
  };

  // Delete a booking
  const deleteBooking = (id) => {
    setBookings(prev => prev.filter(booking => booking.id !== id));
  };

  // Update a booking
  const updateBooking = (id, updatedData) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === id 
          ? { ...booking, ...updatedData, updatedAt: new Date().toISOString() }
          : booking
      )
    );
  };

  // Get room details by ID
  const getRoomById = (roomId) => {
    const id = typeof roomId === 'string' ? Number(roomId) : roomId;
    return roomData.find(room => room.id === id);
  };

  const shareWithChildren = {
    bookings,
    addBooking,
    deleteBooking,
    updateBooking,
    getRoomById,
  };

  return (
    <BookingInfo.Provider value={shareWithChildren}>
      {children}
    </BookingInfo.Provider>
  );
};

export const useBookingContext = () => useContext(BookingInfo);
