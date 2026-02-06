import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Service from "./pages/Service";
import PaymentResult from "./components/modals/booking/PaymentResult";
import MyBooKing from "./pages/MyBooKing";
import UserReviews from "./pages/UserReviews";
import UploadAvatar from "./components/modals/profile/UploadAvatar";
import UpdateInfo from "./components/modals/profile/UpdateInfo";
import ProfileMe from "./pages/ProfileMe";
import Booking from "./pages/Booking";
import { SelectShowtime } from "./components/ShowtimeSelect";
import { MovieBooking } from "./pages/MovieBooking";
import Staff from "./pages/Staff";
import { Customer } from "./pages/Customer";
import { Operation } from "./pages/Operation";
import { Schedule } from "./pages/Schedule";
import Support from "./pages/Support";
import { CounterBooking } from "./pages/CounterBooking";
import Transaction from "./pages/Transaction";
import EventsPromotions from './pages/EventsPromotions';
import EventsCarousel from './components/EventsCarousel';
import MyShiftTimeline from "./pages/MyShiftTimeline";
import ReportStat from "./pages/ReportStat";



export default function App() {
    return (
        <>
            <Header />
            <EventsCarousel />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/serv" element={<Service />} />
                <Route path="/payment-result" element={<PaymentResult />} />
                <Route path="/bk-his" element={<MyBooKing />} />
                <Route path="/rev" element={<UserReviews />} />
                <Route path="/pos/:movieId" element={<SelectShowtime />} />
                <Route path="/pos/:movieId/:showtimeId" element={<CounterBooking />} />
                <Route path="/ev-prom" element={<EventsPromotions />} />
                <Route path="/mov-bk" element={<MovieBooking />} />
                <Route path="/booking/:movieId" element={<SelectShowtime />} />
                <Route path="/booking/:movieId/:showtimeId" element={<Booking />} />
                <Route path="/admin/service" element={<Service />} />
                <Route path="/bk-his" element={<MyBooKing />} />
                <Route path="/rev" element={<UserReviews />} />
                <Route path="/prof" element={<ProfileMe />} />
                <Route path="/profile/avatar" element={<UploadAvatar />} />
                <Route path="/profile/edit-basic" element={<UpdateInfo />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/cus" element={<Customer />} /> 
                <Route path="/op" element={<Operation />} />
                <Route path="/sched" element={<Schedule />} />
                <Route path="/sup" element={<Support />} />
                <Route path="/my-shifts" element={<MyShiftTimeline />} />
                <Route path="/trans" element={<Transaction />} />
                <Route path="/rep" element={<ReportStat />} />
            </Routes>

            <Footer />
        </>
    );
}
