import api from "./api";

export async function getSeatsByRoom(roomId) {
  try {
    const res = await api.get(`/api/seats/room/${roomId}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching seats by room:", error);
    throw error;
  }
}

export async function createBooking(
  showtimeId,
  customerId = null,
  seatIds = [],
  serviceOrderId = null,
  isCounterBooking = false,
  cashierId = null,
  customerPhone = null
) {
  try {
    if (!showtimeId) {
      throw new Error("showtimeId is required");
    }

    if (!seatIds || seatIds.length === 0) {
      throw new Error("seatIds cannot be empty");
    }

    const payload = {
      showtimeId,
      seatIds,
      isCounterBooking: isCounterBooking || false
    };

    if (serviceOrderId) {
      payload.serviceOrderId = serviceOrderId;
    }

    if (isCounterBooking) {
      if (!cashierId) {
        throw new Error("cashierId is required for counter booking");
      }
      if (!customerPhone) {
        throw new Error("customerPhone is required for counter booking");
      }
      payload.cashierId = cashierId;
      payload.customerPhone = customerPhone;
    } else {
      if (!customerId) {
        throw new Error("customerId is required for online booking");
      }
      payload.customerId = customerId;
    }

    console.log("📤 Creating booking with payload:", payload);

    const res = await api.post("/api/bookings", payload);
    
    console.log("✅ Booking created successfully:", res.data);
    
    return res.data;
    
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    console.error("❌ Error response:", error.response?.data);
    throw error;
  }
}

export async function getShowtimeById(showtimeId) {
  try {
    const res = await api.get(`/api/showtimes/${showtimeId}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching showtime:", error);
    throw error;
  }
}

export async function getSeatsByShowtime(showtimeId) {
  try {
    const res = await api.get(`/api/showtimes/${showtimeId}/seats`);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching seats by showtime:", error);
    throw error;
  }
}

export async function getBookingsByCustomer(customerId) {
  try {
    const res = await api.get(`/api/bookings/customer/${customerId}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    throw error;
  }
}

export async function getBookingById(bookingId) {
  try {
    const res = await api.get(`/api/bookings/${bookingId}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching booking:", error);
    throw error;
  }
}