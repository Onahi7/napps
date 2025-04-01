"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getHotels,
  updateHotel,
  deleteHotel,
  createHotel,
} from "@/actions/hotel-actions"
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Star,
  MapPin,
  BedDouble,
  Wifi,
  UtensilsCrossed,
  Car,
  Droplets,
  Coffee,
  Tv,
  Snowflake,
  Maximize,
  ShowerHead,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Helper function to render amenity icon
const renderAmenityIcon = (amenity: string) => {
  switch (amenity) {
    case "wifi":
      return <Wifi className="h-4 w-4" />
    case "breakfast":
      return <Coffee className="h-4 w-4" />
    case "pool":
      return <Droplets className="h-4 w-4" />
    case "parking":
      return <Car className="h-4 w-4" />
    case "restaurant":
      return <UtensilsCrossed className="h-4 w-4" />
    case "tv":
      return <Tv className="h-4 w-4" />
    case "ac":
      return <Snowflake className="h-4 w-4" />
    case "minibar":
      return <Coffee className="h-4 w-4" />
    case "workspace":
      return <Maximize className="h-4 w-4" />
    case "bathtub":
      return <ShowerHead className="h-4 w-4" />
    default:
      return null
  }
}

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedHotel, setSelectedHotel] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    pricePerNight: "",
    priceCategory: "standard",
    distanceFromVenue: "",
    rating: "",
    availableRooms: "",
    amenities: "",
    contactPhone: "",
    contactWhatsapp: "",
    featured: false,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchHotels()
  }, [])

  const fetchHotels = async () => {
    setLoading(true)
    try {
      const data = await getHotels()
      setHotels(data)
    } catch (error) {
      console.error("Error fetching hotels:", error)
      toast({
        title: "Error",
        description: "Failed to load hotels. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: "",
      pricePerNight: "",
      priceCategory: "standard",
      distanceFromVenue: "",
      rating: "",
      availableRooms: "",
      amenities: "",
      contactPhone: "",
      contactWhatsapp: "",
      featured: false,
    })
    setImageFile(null)
    setImagePreview("")
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const hotelData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        pricePerNight: Number(formData.pricePerNight),
        priceCategory: formData.priceCategory as "ECONOMY" | "STANDARD" | "PREMIUM",
        availableRooms: Number(formData.availableRooms),
        amenities: formData.amenities.split(',').map(item => item.trim()),
        distanceFromVenue: Number(formData.distanceFromVenue),
        rating: Number(formData.rating),
        contactPhone: formData.contactPhone,
        contactWhatsapp: formData.contactWhatsapp,
        isFeatured: formData.featured
      }

      if (imageFile) {
        // Handle image upload separately if needed
        // Add imageUrl to hotelData after upload
      }

      const result = await createHotel(hotelData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Hotel added successfully",
        })
        resetForm()
        setIsAddDialogOpen(false)
        fetchHotels()
      } else {
        toast({
          title: "Error",
          description: (result as { error?: string }).error || "Failed to add hotel",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding hotel:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditHotel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHotel) return

    setIsSubmitting(true)

    try {
      const hotelData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        pricePerNight: Number(formData.pricePerNight),
        priceCategory: formData.priceCategory as "ECONOMY" | "STANDARD" | "PREMIUM",
        distanceFromVenue: Number(formData.distanceFromVenue),
        rating: Number(formData.rating),
        availableRooms: Number(formData.availableRooms),
        amenities: formData.amenities.split(',').map(item => item.trim()),
        contactPhone: formData.contactPhone,
        contactWhatsapp: formData.contactWhatsapp,
        isFeatured: formData.featured
      }

      if (imageFile) {
        // TODO: Handle image upload separately if needed
        // hotelData.imageUrl = imageUrl
      }

      const result = await updateHotel(selectedHotel.id, hotelData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Hotel updated successfully",
        })
        resetForm()
        setIsEditDialogOpen(false)
        fetchHotels()
      } else {
        toast({
          title: "Error",
          description: "Failed to update hotel",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating hotel:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteHotel = async (id: string) => {
    try {
      const result = await deleteHotel(id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Hotel deleted successfully",
        })
        fetchHotels()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete hotel",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting hotel:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (hotel: any) => {
    setSelectedHotel(hotel)
    setFormData({
      name: hotel.name,
      description: hotel.description || "",
      address: hotel.address || "",
      pricePerNight: hotel.price_per_night.toString(),
      priceCategory: hotel.price_category,
      distanceFromVenue: hotel.distance_from_venue.toString(),
      rating: hotel.rating.toString(),
      availableRooms: hotel.available_rooms.toString(),
      amenities: hotel.amenities ? hotel.amenities.join(", ") : "",
      contactPhone: hotel.contact_phone || "",
      contactWhatsapp: hotel.contact_whatsapp || "",
      featured: hotel.featured || false,
    })
    setImagePreview(hotel.image_url || "")
    setIsEditDialogOpen(true)
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <DashboardSidebar role="admin" />
      <div className="flex flex-col">
        <DashboardHeader role="admin" title="Hotel Management" />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Manage Conference Hotels</h1>
            <Button
              onClick={() => {
                resetForm()
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Hotel
            </Button>
          </div>

          <Tabs defaultValue="all" className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Hotels</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="economy">Economy</TabsTrigger>
              <TabsTrigger value="standard">Standard</TabsTrigger>
              <TabsTrigger value="premium">Premium</TabsTrigger>
            </TabsList>

            <TabsContent value="all">{renderHotelsList(hotels)}</TabsContent>
            <TabsContent value="featured">{renderHotelsList(hotels.filter((hotel) => hotel.featured))}</TabsContent>
            <TabsContent value="economy">
              {renderHotelsList(hotels.filter((hotel) => hotel.price_category === "economy"))}
            </TabsContent>
            <TabsContent value="standard">
              {renderHotelsList(hotels.filter((hotel) => hotel.price_category === "standard"))}
            </TabsContent>
            <TabsContent value="premium">
              {renderHotelsList(hotels.filter((hotel) => hotel.price_category === "premium"))}
            </TabsContent>
          </Tabs>

          {/* Add Hotel Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Hotel</DialogTitle>
                <DialogDescription>Add a new hotel for conference participants to book</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddHotel}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Hotel Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerNight">Price Per Night (₦)</Label>
                    <Input
                      id="pricePerNight"
                      type="number"
                      value={formData.pricePerNight}
                      onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceCategory">Price Category</Label>
                    <Select
                      value={formData.priceCategory}
                      onValueChange={(value) => setFormData({ ...formData, priceCategory: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economy">Economy</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distanceFromVenue">Distance from Venue (km)</Label>
                    <Input
                      id="distanceFromVenue"
                      type="number"
                      step="0.1"
                      value={formData.distanceFromVenue}
                      onChange={(e) => setFormData({ ...formData, distanceFromVenue: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating (0-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availableRooms">Available Rooms</Label>
                    <Input
                      id="availableRooms"
                      type="number"
                      value={formData.availableRooms}
                      onChange={(e) => setFormData({ ...formData, availableRooms: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactWhatsapp">WhatsApp Number (with country code)</Label>
                    <Input
                      id="contactWhatsapp"
                      value={formData.contactWhatsapp}
                      onChange={(e) => setFormData({ ...formData, contactWhatsapp: e.target.value })}
                      placeholder="e.g. 2348012345678"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="amenities">Amenities (comma separated)</Label>
                    <Input
                      id="amenities"
                      value={formData.amenities}
                      onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                      placeholder="wifi, breakfast, pool, parking, restaurant, ac, tv"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="image">Hotel Image</Label>
                    <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                    {imagePreview && (
                      <div className="mt-2">
                        <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="max-h-40 rounded-md" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked === true })}
                    />
                    <Label htmlFor="featured">Featured Hotel</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Hotel"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Hotel Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Hotel</DialogTitle>
                <DialogDescription>Update hotel information</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditHotel}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Hotel Name</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Input
                      id="edit-address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-pricePerNight">Price Per Night (₦)</Label>
                    <Input
                      id="edit-pricePerNight"
                      type="number"
                      value={formData.pricePerNight}
                      onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-priceCategory">Price Category</Label>
                    <Select
                      value={formData.priceCategory}
                      onValueChange={(value) => setFormData({ ...formData, priceCategory: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economy">Economy</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-distanceFromVenue">Distance from Venue (km)</Label>
                    <Input
                      id="edit-distanceFromVenue"
                      type="number"
                      step="0.1"
                      value={formData.distanceFromVenue}
                      onChange={(e) => setFormData({ ...formData, distanceFromVenue: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-rating">Rating (0-5)</Label>
                    <Input
                      id="edit-rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-availableRooms">Available Rooms</Label>
                    <Input
                      id="edit-availableRooms"
                      type="number"
                      value={formData.availableRooms}
                      onChange={(e) => setFormData({ ...formData, availableRooms: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-contactPhone">Contact Phone</Label>
                    <Input
                      id="edit-contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-contactWhatsapp">WhatsApp Number (with country code)</Label>
                    <Input
                      id="edit-contactWhatsapp"
                      value={formData.contactWhatsapp}
                      onChange={(e) => setFormData({ ...formData, contactWhatsapp: e.target.value })}
                      placeholder="e.g. 2348012345678"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-amenities">Amenities (comma separated)</Label>
                    <Input
                      id="edit-amenities"
                      value={formData.amenities}
                      onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                      placeholder="wifi, breakfast, pool, parking, restaurant, ac, tv"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-image">Hotel Image</Label>
                    <Input id="edit-image" type="file" accept="image/*" onChange={handleImageChange} />
                    {imagePreview && (
                      <div className="mt-2">
                        <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="max-h-40 rounded-md" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked === true })}
                    />
                    <Label htmlFor="edit-featured">Featured Hotel</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Hotel"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )

  function renderHotelsList(hotelsList: any[]) {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading hotels...</span>
        </div>
      )
    }

    if (hotelsList.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No hotels found in this category.</p>
          <Button
            onClick={() => {
              resetForm()
              setIsAddDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Hotel
          </Button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hotelsList.map((hotel) => (
          <Card key={hotel.id} className="overflow-hidden">
            <div className="relative h-40">
              <img
                src={hotel.image_url || "/placeholder.svg?height=400&width=600&text=Hotel+Image"}
                alt={hotel.name}
                className="h-full w-full object-cover"
              />
              {hotel.featured && <Badge className="absolute top-2 right-2 bg-primary">Featured</Badge>}
              <Badge
                className={`absolute bottom-2 left-2 ${
                  hotel.price_category === "economy"
                    ? "bg-blue-500"
                    : hotel.price_category === "standard"
                      ? "bg-purple-500"
                      : "bg-amber-500"
                }`}
              >
                {hotel.price_category.charAt(0).toUpperCase() + hotel.price_category.slice(1)}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle>{hotel.name}</CardTitle>
              <CardDescription className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {hotel.address}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-2">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span>{hotel.rating}</span>
                </div>
                <div className="mx-2">•</div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{hotel.distance_from_venue} km</span>
                </div>
                <div className="mx-2">•</div>
                <div className="flex items-center">
                  <BedDouble className="h-4 w-4 mr-1" />
                  <span>{hotel.available_rooms} rooms</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{hotel.description}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {hotel.amenities &&
                  hotel.amenities.slice(0, 5).map((amenity: string) => (
                    <div key={amenity} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                      {renderAmenityIcon(amenity)}
                      <span className="capitalize">{amenity}</span>
                    </div>
                  ))}
                {hotel.amenities && hotel.amenities.length > 5 && (
                  <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                    +{hotel.amenities.length - 5} more
                  </div>
                )}
              </div>
              <div className="font-medium">₦{hotel.price_per_night.toLocaleString()} per night</div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => openEditDialog(hotel)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the hotel and remove it from the
                      system.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteHotel(hotel.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }
}

