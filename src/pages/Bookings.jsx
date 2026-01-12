import { useState } from 'react';
import { useBookingContext } from '../context/BookingContext';
import { roomData } from '../db/data';
import { BsCalendar, BsPerson, BsTelephone, BsEnvelope, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { FaTrash, FaEdit, FaClock } from 'react-icons/fa';
import { Menu } from '@headlessui/react';
import { BsChevronDown } from 'react-icons/bs';
import { adultsList, kidsList } from '../constants/data';
import { ScrollToTop } from '../components';

const Bookings = () => {
  const { bookings, addBooking, deleteBooking, updateBooking, getRoomById } = useBookingContext();

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roomId: '',
    selectedDate: null,
    selectedTime: null,
    checkIn: null,
    checkOut: null,
    adults: '1 Adult',
    kids: '0 Kid',
    specialRequests: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // Generate time slots (every 30 minutes from 6am to 11pm)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        const timeString = time.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Check if date is in the past
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Handle day selection
  const handleDaySelect = (date) => {
    if (!date || isPastDate(date)) return;
    setSelectedDay(date);
    setFormData(prev => ({ 
      ...prev, 
      selectedDate: date,
      checkIn: date,
      selectedTime: null 
    }));
  };

  // Handle time selection
  const handleTimeSelect = (time) => {
    setFormData(prev => ({ 
      ...prev, 
      selectedTime: time 
    }));
  };

  // Navigate months
  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Calculate total nights and price
  const calculateTotal = (checkIn, checkOut, roomId) => {
    if (!checkIn || !checkOut || !roomId) return { nights: 0, total: 0 };
    
    const room = getRoomById(roomId);
    if (!room) return { nights: 0, total: 0 };

    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const total = nights * room.price;
    
    return { nights, total };
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle check-out date change
  const handleCheckOutChange = (date) => {
    setFormData(prev => ({ ...prev, checkOut: date }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.selectedDate || !formData.roomId) {
      alert('Please select a room and date');
      return;
    }

    // Set check-in to selected date, check-out to next day if not set
    const checkIn = formData.selectedDate;
    const checkOut = formData.checkOut || new Date(checkIn.getTime() + 24 * 60 * 60 * 1000);
    
    if (editingId) {
      // Update existing booking
      const { nights, total } = calculateTotal(checkIn, checkOut, formData.roomId);
      updateBooking(editingId, {
        ...formData,
        roomId: Number(formData.roomId),
        nights,
        total,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
      });
      setEditingId(null);
    } else {
      // Create new booking
      const { nights, total } = calculateTotal(checkIn, checkOut, formData.roomId);
      addBooking({
        ...formData,
        roomId: Number(formData.roomId),
        nights,
        total,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
      });
    }

    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      roomId: '',
      selectedDate: null,
      selectedTime: null,
      checkIn: null,
      checkOut: null,
      adults: '1 Adult',
      kids: '0 Kid',
      specialRequests: ''
    });
    setSelectedDay(null);
  };

  // Handle edit
  const handleEdit = (booking) => {
    const checkInDate = booking.checkIn ? new Date(booking.checkIn) : null;
    setFormData({
      firstName: booking.firstName,
      lastName: booking.lastName,
      email: booking.email,
      phone: booking.phone,
      roomId: String(booking.roomId),
      selectedDate: checkInDate,
      selectedTime: booking.selectedTime || null,
      checkIn: checkInDate,
      checkOut: booking.checkOut ? new Date(booking.checkOut) : null,
      adults: booking.adults || '1 Adult',
      kids: booking.kids || '0 Kid',
      specialRequests: booking.specialRequests || ''
    });
    setSelectedDay(checkInDate);
    setEditingId(booking.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setSelectedDay(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      roomId: '',
      selectedDate: null,
      selectedTime: null,
      checkIn: null,
      checkOut: null,
      adults: '1 Adult',
      kids: '0 Kid',
      specialRequests: ''
    });
  };

  const selectedRoom = formData.roomId ? getRoomById(formData.roomId) : null;
  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <section className="min-h-screen bg-gray-50">
      <ScrollToTop />

      {/* Header */}
      <div className='bg-room h-[300px] relative flex justify-center items-center bg-cover bg-center'>
        <div className='absolute w-full h-full bg-black/70' />
        <div className='text-center z-20'>
          <h1 className='text-5xl text-white font-primary mb-4'>Book Your Stay</h1>
          <p className='text-white text-lg'>Select your room and preferred dates</p>
        </div>
      </div>

      <div className='container mx-auto py-12 px-4'>
        
        {/* Toggle Form Button */}
        <div className='mb-6 flex justify-end'>
          <button
            onClick={() => setShowForm(!showForm)}
            className='btn btn-primary btn-sm w-auto px-6'
          >
            {showForm ? 'Hide Booking Form' : 'New Booking'}
          </button>
        </div>

        {/* Booking Form - Two Panel Layout */}
        {showForm && (
          <div className='bg-white rounded-lg shadow-xl mb-12 overflow-hidden'>
            <div className='flex flex-col lg:flex-row'>
              
              {/* Left Panel - Room Selection & Details */}
              <div className='lg:w-[400px] p-8 border-r border-gray-200'>
                <h2 className='h3 mb-6'>{editingId ? 'Edit Booking' : 'Select Room'}</h2>
                
                <form onSubmit={handleSubmit} className='space-y-6'>
                  {/* Room Selection */}
                  <div>
                    <label className='block text-sm font-semibold mb-2'>Select Room *</label>
                    <select
                      name='roomId'
                      value={formData.roomId}
                      onChange={handleInputChange}
                      required
                      className='w-full h-12 px-4 border border-gray-300 focus:outline-none focus:border-accent'
                    >
                      <option value=''>Choose a room...</option>
                      {roomData.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.name} - ${room.price}/night
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room Details */}
                  {selectedRoom && (
                    <div className='bg-accent/10 p-4 rounded-lg'>
                      <h3 className='font-semibold mb-2'>{selectedRoom.name}</h3>
                      <p className='text-sm text-gray-600 mb-2'>{selectedRoom.description.substring(0, 100)}...</p>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm'>Max {selectedRoom.maxPerson} persons</span>
                        <span className='text-lg font-bold text-accent'>${selectedRoom.price}/night</span>
                      </div>
                    </div>
                  )}

                  {/* Personal Information */}
                  <div className='space-y-4 pt-4 border-t'>
                    <h3 className='font-semibold'>Guest Information</h3>
                    <div>
                      <label className='block text-sm font-semibold mb-2'>First Name *</label>
                      <input
                        type='text'
                        name='firstName'
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className='w-full h-10 px-4 border border-gray-300 focus:outline-none focus:border-accent'
                        placeholder='John'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-semibold mb-2'>Last Name *</label>
                      <input
                        type='text'
                        name='lastName'
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className='w-full h-10 px-4 border border-gray-300 focus:outline-none focus:border-accent'
                        placeholder='Doe'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-semibold mb-2'>Email *</label>
                      <div className='relative'>
                        <BsEnvelope className='absolute left-3 top-1/2 transform -translate-y-1/2 text-accent' />
                        <input
                          type='email'
                          name='email'
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className='w-full h-10 pl-10 pr-4 border border-gray-300 focus:outline-none focus:border-accent'
                          placeholder='john@example.com'
                        />
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-semibold mb-2'>Phone *</label>
                      <div className='relative'>
                        <BsTelephone className='absolute left-3 top-1/2 transform -translate-y-1/2 text-accent' />
                        <input
                          type='tel'
                          name='phone'
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className='w-full h-10 pl-10 pr-4 border border-gray-300 focus:outline-none focus:border-accent'
                          placeholder='+1 234 567 8900'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Guests */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-semibold mb-2'>Adults *</label>
                      <Menu as='div' className='w-full h-10 bg-white border border-gray-300 relative'>
                        <Menu.Button className='w-full h-full flex items-center justify-between px-3 text-sm'>
                          {formData.adults}
                          <BsChevronDown className='text-base text-accent-hover' />
                        </Menu.Button>
                        <Menu.Items as='ul' className='bg-white absolute w-full flex flex-col z-40 shadow-lg border border-gray-300'>
                          {adultsList.map(({ name }, idx) => (
                            <Menu.Item
                              as='li'
                              key={idx}
                              onClick={() => setFormData(prev => ({ ...prev, adults: name }))}
                              className='border-b last-of-type:border-b-0 h-10 hover:bg-accent hover:text-white w-full flex items-center justify-center cursor-pointer px-3 text-sm'
                            >
                              {name}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Menu>
                    </div>
                    <div>
                      <label className='block text-sm font-semibold mb-2'>Kids</label>
                      <Menu as='div' className='w-full h-10 bg-white border border-gray-300 relative'>
                        <Menu.Button className='w-full h-full flex items-center justify-between px-3 text-sm'>
                          {formData.kids}
                          <BsChevronDown className='text-base text-accent-hover' />
                        </Menu.Button>
                        <Menu.Items as='ul' className='bg-white absolute w-full flex flex-col z-40 shadow-lg border border-gray-300'>
                          {kidsList.map(({ name }, idx) => (
                            <Menu.Item
                              as='li'
                              key={idx}
                              onClick={() => setFormData(prev => ({ ...prev, kids: name }))}
                              className='border-b last-of-type:border-b-0 h-10 hover:bg-accent hover:text-white w-full flex items-center justify-center cursor-pointer px-3 text-sm'
                            >
                              {name}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Menu>
                    </div>
                  </div>

                  {/* Check-out Date */}
                  {formData.selectedDate && (
                    <div>
                      <label className='block text-sm font-semibold mb-2'>Check-out Date *</label>
                      <div className='relative flex items-center h-10 border border-gray-300'>
                        <div className='absolute z-10 pl-3'>
                          <BsCalendar className='text-accent text-sm' />
                        </div>
                        <input
                          type='date'
                          value={formData.checkOut ? formData.checkOut.toISOString().split('T')[0] : ''}
                          onChange={(e) => handleCheckOutChange(new Date(e.target.value))}
                          min={formData.selectedDate.toISOString().split('T')[0]}
                          required
                          className='w-full h-full pl-10 pr-3 text-sm focus:outline-none'
                        />
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  <div>
                    <label className='block text-sm font-semibold mb-2'>Special Requests</label>
                    <textarea
                      name='specialRequests'
                      value={formData.specialRequests}
                      onChange={handleInputChange}
                      rows={3}
                      className='w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-accent'
                      placeholder='Any special requests...'
                    />
                  </div>

                  {/* Submit Button */}
                  <div className='flex gap-3 pt-4'>
                    <button
                      type='submit'
                      className='btn btn-primary btn-sm flex-1'
                    >
                      {editingId ? 'Update Booking' : 'Confirm Booking'}
                    </button>
                    {editingId && (
                      <button
                        type='button'
                        onClick={handleCancelEdit}
                        className='btn btn-secondary btn-sm px-6'
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Right Panel - Calendar & Time Slots */}
              <div className='flex-1 p-8'>
                <h2 className='h3 mb-6'>Select a Date & Time</h2>
                
                {/* Calendar */}
                <div className='mb-8'>
                  {/* Month Navigation */}
                  <div className='flex items-center justify-between mb-6'>
                    <button
                      onClick={() => navigateMonth(-1)}
                      className='w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent/10 transition-all duration-200'
                    >
                      <BsChevronLeft className='text-accent text-lg' />
                    </button>
                    <h3 className='text-xl font-semibold text-gray-800'>{monthName}</h3>
                    <button
                      onClick={() => navigateMonth(1)}
                      className='w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent/10 transition-all duration-200'
                    >
                      <BsChevronRight className='text-accent text-lg' />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className='border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm'>
                    {/* Weekday Headers */}
                    <div className='grid grid-cols-7 bg-gray-50 border-b border-gray-200'>
                      {weekDays.map(day => (
                        <div key={day} className='p-3 text-center text-xs font-semibold text-gray-600'>
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className='grid grid-cols-7 gap-2 p-2'>
                      {days.map((day, idx) => {
                        if (!day) {
                          return <div key={`empty-${idx}`} className='aspect-square' />;
                        }
                        
                        const isSelected = selectedDay && 
                          day.toDateString() === selectedDay.toDateString();
                        const isPast = isPastDate(day);
                        const isToday = day.toDateString() === new Date().toDateString();
                        
                        return (
                          <div key={day.toISOString()} className='flex items-center justify-center aspect-square'>
                            <button
                              type='button'
                              onClick={() => handleDaySelect(day)}
                              disabled={isPast}
                              className={`
                                w-12 h-12 rounded-full
                                flex items-center justify-center
                                text-sm font-medium
                                transition-all duration-200
                                ${isPast 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-gray-700 hover:bg-accent/10 cursor-pointer'
                                }
                                ${isSelected 
                                  ? 'bg-accent text-white shadow-lg scale-110' 
                                  : ''
                                }
                                ${isToday && !isSelected 
                                  ? 'ring-2 ring-accent ring-offset-2 bg-accent/5' 
                                  : ''
                                }
                              `}
                            >
                              {day.getDate()}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDay && (
                  <div>
                    <h3 className='font-semibold mb-4 flex items-center gap-2'>
                      <FaClock className='text-accent' />
                      Available Times for {selectedDay.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto'>
                      {timeSlots.map((time, idx) => {
                        const isSelected = formData.selectedTime === time;
                        return (
                          <button
                            key={idx}
                            type='button'
                            onClick={() => handleTimeSelect(time)}
                            className={`
                              px-4 py-2.5 text-sm border rounded-full transition-all
                              ${isSelected
                                ? 'bg-accent text-white border-accent font-semibold shadow-md scale-105'
                                : 'bg-white border-gray-300 hover:border-accent hover:bg-accent/5 hover:shadow-sm'
                              }
                            `}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!selectedDay && (
                  <div className='text-center py-12 text-gray-400'>
                    <BsCalendar className='text-4xl mx-auto mb-4' />
                    <p>Select a date to view available times</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bookings List */}
        <div>
          <h2 className='h2 mb-6'>Your Bookings ({bookings.length})</h2>
          
          {bookings.length === 0 ? (
            <div className='bg-white rounded-lg shadow-lg p-12 text-center'>
              <p className='text-gray-500 text-lg mb-4'>No bookings yet</p>
              <p className='text-gray-400'>Create your first booking using the form above</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {bookings.map(booking => {
                const room = getRoomById(booking.roomId);
                const checkIn = booking.checkIn ? new Date(booking.checkIn) : null;
                const checkOut = booking.checkOut ? new Date(booking.checkOut) : null;
                
                return (
                  <div key={booking.id} className='bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow'>
                    <div className='p-6'>
                      {/* Header */}
                      <div className='flex justify-between items-start mb-4'>
                        <div>
                          <h3 className='h3'>{room?.name || 'Room'}</h3>
                          <p className='text-sm text-gray-500'>{booking.firstName} {booking.lastName}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>

                      {/* Details */}
                      <div className='space-y-3 mb-4'>
                        <div className='flex items-center gap-2 text-sm'>
                          <BsEnvelope className='text-accent' />
                          <span>{booking.email}</span>
                        </div>
                        <div className='flex items-center gap-2 text-sm'>
                          <BsTelephone className='text-accent' />
                          <span>{booking.phone}</span>
                        </div>
                        {checkIn && (
                          <div className='flex items-center gap-2 text-sm'>
                            <BsCalendar className='text-accent' />
                            <span>
                              {checkIn.toLocaleDateString()} - {checkOut?.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {booking.selectedTime && (
                          <div className='flex items-center gap-2 text-sm'>
                            <FaClock className='text-accent' />
                            <span>Time: {booking.selectedTime}</span>
                          </div>
                        )}
                        <div className='flex items-center gap-2 text-sm'>
                          <BsPerson className='text-accent' />
                          <span>{booking.adults}, {booking.kids}</span>
                        </div>
                        {booking.nights && (
                          <div className='text-sm'>
                            <span className='font-semibold'>{booking.nights} night{booking.nights > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {booking.specialRequests && (
                          <div className='text-sm text-gray-600 italic'>
                            "{booking.specialRequests}"
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className='border-t pt-4 mb-4'>
                        <div className='flex justify-between items-center'>
                          <span className='text-sm text-gray-600'>Total Amount</span>
                          <span className='text-2xl font-bold text-accent'>${booking.total || 0}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className='flex gap-2'>
                        <button
                          onClick={() => handleEdit(booking)}
                          className='flex-1 btn btn-secondary btn-sm'
                        >
                          <FaEdit className='inline mr-2' />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this booking?')) {
                              deleteBooking(booking.id);
                            }
                          }}
                          className='btn btn-sm bg-red-600 hover:bg-red-700 px-6'
                        >
                          <FaTrash className='inline' />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Bookings;
