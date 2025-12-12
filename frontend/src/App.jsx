import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterUser from './pages/RegisterUser';
import UsersList from './pages/UsersList';
import UserDetails from './pages/UserDetails';
import Profile from './pages/Profile';
import PasswordResetRequest from './pages/PasswordResetRequest';
import ResetPassword from './pages/ResetPassword';
import PurchasePage from './pages/PurchasePage';
import TransactionsList from './pages/TransactionsList';
import TransactionDetails from './pages/TransactionDetails';
import MyTransactions from './pages/MyTransactions';
import CreateRedemption from './pages/CreateRedemption';
import TransferPoints from './pages/TransferPoints';
import EventsList from './pages/EventsList';
// import EventDetailsBasic from './pages/EventDetailsBasic';
// import EventDetailsFull from './pages/EventDetailsFull';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/CreateEvent';
import EventEdit from './pages/EventEdit';
import PromotionsCreate from './pages/PromotionsCreate';
import PromotionDetails from './pages/PromotionDetails';
import PromotionsList from './pages/PromotionsList';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './layout/Layout';

// --------------------------------------------
//  Helper component: renders correct Event page
// --------------------------------------------
// function EventDetailsWrapper() {
//     const { role } = useAuth();

//     const isBasic = role === 'regular' || role === 'cashier';
//     return isBasic ? <EventDetailsBasic /> : <EventDetailsFull />;
// }

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>

                    {/* LOGIN */}
                    <Route path='/' element={<Login />} />
                    <Route path='/login' element={<Login />} />

                    {/* PASSWORD RESET */}
                    <Route path="/forgot-password" element={<PasswordResetRequest />} />
                    <Route path="/reset-password/:resetToken" element={<ResetPassword />} />

                    {/* DASHBOARD */}
                    <Route
                        path='/dashboard'
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <Dashboard />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* USERS */}
                    <Route
                        path='/users/register'
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <RegisterUser />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='/users'
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <UsersList />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='/users/:userId'
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <UserDetails />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* PROFILE */}
                    <Route
                        path='/profile'
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <Profile />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* TRANSACTIONS */}
                    <Route
                        path="/transactions/purchase"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <PurchasePage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path='/transactions'
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <TransactionsList />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path='/transactions/:transactionId'
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <TransactionDetails />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* MY TRANSACTIONS */}
                    <Route
                        path="/my-transactions"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <MyTransactions />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* REDEMPTION & TRANSFER */}
                    <Route
                        path="/redeem"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <CreateRedemption />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/transfer"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <TransferPoints />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* EVENTS LIST */}
                    <Route
                        path="/events"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <EventsList />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* CREATE EVENT */}
                    <Route
                        path="/events/create"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <CreateEvent />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* EVENT DETAILS (role-based) */}
                    <Route
                        path="/events/:eventId"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <EventDetails />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    {/* <Route
                        path="/events/:eventId"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <EventDetailsWrapper />
                                </Layout>
                            </ProtectedRoute>
                        }
                    /> */}
                    <Route
                        path="/events/:eventId/edit"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <EventEdit />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/promotions/create"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <PromotionsCreate />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/promotions/:promotionId"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <PromotionDetails />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/promotions/"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <PromotionsList />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
