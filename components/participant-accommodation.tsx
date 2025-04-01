"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Hotel, MapPin, Star, BedDouble, Calendar, Phone, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getHotels, createBooking, getUserBookings, cancelHotelBooking } from "@/actions/hotel-actions"
import { useSession } from "next-auth/react"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"

export default function ParticipantAccommodation() {
  const { data: session } = useSession()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null)
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchHotels()
    fetchBookings()
  }, [])

  async function fetchHotels() {
    try {
      const data = await getHotels()
      // Transform the data to match our interface
      const transformedHotels = data.map(h => ({
        id: h.id,
        name: h.name,
        description: h.description || '',
        address: h.address || '',
        price_per_night: h.pricePerNight,
        price_category: h.priceCategory.toLowerCase() as 'economy' | 'standard' | 'premium',
        image_url: h.imageUrl,
        available_rooms: h.availableRooms,
        distance_from_venue: h.distanceFromVenue || 0,
        rating: h.rating || 0,
        amenities: h.amenities || [],
        contact_phone: h.contactPhone || '',
        contact_whatsapp: h.contactWhatsapp || '',
        is_featured: h.isFeatured || false
      }))
      setHotels(transformedHotels)
    } catch (error) {
      console.error('Error fetching hotels:', error)
      toast({
        title: "Error",
        description: "Failed to load hotels",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchBookings() {
    try {
      const data = await getUserBookings()
      // Transform the data to match our interface
      const transformedBookings = data.map(b => ({
        id: b.id,
        hotel_name: b.hotelName,
        check_in_date: b.checkIn,
        check_out_date: b.checkOut,
        booking_status: b.status.toLowerCase() as 'pending' | 'confirmed' | 'cancelled',
        created_at: new Date().toISOString(), // Fallback if not provided
        address: '', // These fields might need to be added to the API response
        contact_whatsapp: ''
      }))
      setBookings(transformedBookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive"
      })
    }
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHotel) return

    setIsSubmitting(true)
    try {
      const checkIn = new Date(formData.checkIn)
      const checkOut = new Date(formData.checkOut)
      
      const bookingId = await createBooking({
        hotelId: selectedHotel.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        amount: selectedHotel.price_per_night * Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      })

      // Construct WhatsApp link
      const whatsappLink = `https://wa.me/${selectedHotel.contact_whatsapp}`
      window.open(whatsappLink, '_blank')

      toast({
        title: "Success",
        description: "Booking request sent. Please check WhatsApp to complete your booking.",
      })
      
      setIsBookingDialogOpen(false)
      resetForm()
      fetchBookings()
    } catch (error) {
      console.error('Error creating booking:', error)
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    
    setIsSubmitting(true)
    try {
      await cancelHotelBooking(selectedBooking.id)
      
      // Construct WhatsApp link since API doesn't return it
      const whatsappLink = `https://wa.me/${selectedBooking.contact_whatsapp}`
      window.open(whatsappLink, '_blank')

      toast({
        title: "Success",
        description: "Booking has been cancelled. A message has been sent to the hotel.",
      })
      
      setIsCancelDialogOpen(false)
      setSelectedBooking(null)
      fetchBookings()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      checkIn: "",
      checkOut: ""
    })
    setSelectedHotel(null)
  }

  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.address.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || hotel.price_category === selectedCategory

    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
        <DashboardSidebar role="participant" />
        <div className="flex flex-col">
          <DashboardHeader role="participant" title="Accommodation" />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <DashboardSidebar role="participant" />
      <div className="flex flex-col">
        <DashboardHeader role="participant" title="Accommodation" />
        <main className="flex-1 p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Conference Hotels</h2>
            <p className="text-sm text-muted-foreground">
              Browse and book accommodation for the duration of the conference
            </p>
          </div>

          <Tabs defaultValue="hotels">
            <TabsList>
              <TabsTrigger value="hotels">Available Hotels</TabsTrigger>
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            </TabsList>

            <TabsContent value="hotels" className="mt-6">
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search hotels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredHotels.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Hotel className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hotels found</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      Try adjusting your search criteria or check back later for new listings.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredHotels.map((hotel) => (
                    <Card key={hotel.id} className="overflow-hidden">
                      <div className="relative h-48">
                        <img
                          src={hotel.image_url || "/placeholder.png"}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                        />
                        {hotel.is_featured && (
                          <Badge className="absolute top-2 right-2">Featured</Badge>
                        )}
                      </div>
                      <CardHeader>
                        <CardTitle>{hotel.name}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-4 w-4" />
                            {hotel.address}
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span>{hotel.rating}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{hotel.distance_from_venue}km from venue</span>
                          </div>
                          <div className="flex items-center">
                            <BedDouble className="h-4 w-4 mr-1" />
                            <span>{hotel.available_rooms} rooms left</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {hotel.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {hotel.amenities.map((amenity) => (
                            <Badge key={amenity} variant="secondary">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold">
                              ₦{hotel.price_per_night.toLocaleString()}/night
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {hotel.price_category}
                            </Badge>
                          </div>
                          <div className="space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={`tel:${hotel.contact_phone}`}>
                                <Phone className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={`https://wa.me/${hotel.contact_whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full"
                          onClick={() => {
                            setSelectedHotel(hotel)
                            setIsBookingDialogOpen(true)
                          }}
                          disabled={hotel.available_rooms === 0}
                        >
                          {hotel.available_rooms === 0 ? "Fully Booked" : "Book Now"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bookings" className="mt-6">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      You haven't made any hotel bookings yet. Browse available hotels and make a reservation.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {bookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardHeader>
                        <CardTitle>{booking.hotel_name}</CardTitle>
                        <CardDescription>
                          <Badge variant={booking.booking_status === 'confirmed' ? 'default' : 'secondary'}>
                            {booking.booking_status === 'confirmed' ? 'Confirmed' : 'Pending'}
                          </Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Check-in:</span>
                            <span>{new Date(booking.check_in_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Check-out:</span>
                            <span>{new Date(booking.check_out_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`https://wa.me/${booking.contact_whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact Hotel
                          </a>
                        </Button>
                        {booking.booking_status !== 'cancelled' && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking)
                              setIsCancelDialogOpen(true)
                            }}
                          >
                            Cancel Booking
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Booking Dialog */}
          <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book Hotel</DialogTitle>
                <DialogDescription>
                  Enter your stay details to proceed with booking
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBooking}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Check-in Date</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={formData.checkIn}
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Check-out Date</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={formData.checkOut}
                      onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Booking"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Cancel Booking Dialog */}
          <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel this booking? A message will be sent to the hotel via WhatsApp.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Keep Booking</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleCancelBooking}
                  disabled={isSubmitting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Yes, Cancel Booking"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  )
}

interface Hotel {
  id: string
  name: string
  description: string
  address: string
  price_per_night: number
  price_category: 'economy' | 'standard' | 'premium'
  image_url: string | null
  available_rooms: number
  distance_from_venue: number
  rating: number
  amenities: string[]
  contact_phone: string
  contact_whatsapp: string
  is_featured: boolean
}

interface Booking {
  id: string
  hotel_name: string
  check_in_date: string
  check_out_date: string
  booking_status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  address: string
  contact_whatsapp: string
}