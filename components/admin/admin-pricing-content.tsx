"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { pricingApi, type PricingPlan, type CreatePricingPlanDto } from "@/lib/api/pricing"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminPricingContent() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreatePricingPlanDto>({
    planCode: "",
    name: "",
    description: "",
    price: 0,
    currency: "NGN",
    billingCycle: "yearly",
    isTrial: false,
    isPopular: false,
    isActive: true,
    displayOrder: 0,
    features: [],
  })
  const [featureText, setFeatureText] = useState("")

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setIsLoading(true)
      const data = await pricingApi.getAllPlans()
      setPlans(data)
    } catch (error: any) {
      console.error("Failed to fetch pricing plans:", error)
      toast.error(error.message || "Failed to load pricing plans")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedPlan(null)
    setFormData({
      planCode: "",
      name: "",
      description: "",
      price: 0,
      currency: "NGN",
      billingCycle: "yearly",
      isTrial: false,
      isPopular: false,
      isActive: true,
      displayOrder: 0,
      features: [],
    })
    setFeatureText("")
    setIsDialogOpen(true)
  }

  const handleEdit = (plan: PricingPlan) => {
    setSelectedPlan(plan)
    setFormData({
      planCode: plan.planCode,
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      isTrial: plan.isTrial,
      isPopular: plan.isPopular,
      isActive: plan.isActive !== undefined ? plan.isActive : true,
      displayOrder: plan.displayOrder,
      maxStaffUsers: plan.maxStaffUsers,
      maxLocations: plan.maxLocations,
      trialDays: plan.trialDays,
      features: plan.features.map(f => ({
        featureText: f.featureText,
        displayOrder: f.displayOrder,
      })),
    })
    setFeatureText("")
    setIsDialogOpen(true)
  }

  const handleDelete = (plan: PricingPlan) => {
    setSelectedPlan(plan)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedPlan) return

    try {
      await pricingApi.deletePlan(selectedPlan.id)
      toast.success(`Plan "${selectedPlan.name}" deleted successfully`)
      fetchPlans()
      setIsDeleteDialogOpen(false)
      setSelectedPlan(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to delete plan")
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      if (selectedPlan) {
        await pricingApi.updatePlan(selectedPlan.id, formData)
        toast.success(`Plan "${formData.name}" updated successfully`)
      } else {
        await pricingApi.createPlan(formData)
        toast.success(`Plan "${formData.name}" created successfully`)
      }
      setIsDialogOpen(false)
      fetchPlans()
    } catch (error: any) {
      toast.error(error.message || "Failed to save plan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const addFeature = () => {
    if (!featureText.trim()) return
    setFormData({
      ...formData,
      features: [
        ...(formData.features || []),
        {
          featureText: featureText.trim(),
          displayOrder: formData.features?.length || 0,
        },
      ],
    })
    setFeatureText("")
  }

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features?.filter((_, i) => i !== index) || [],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pricing Plans</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage subscription plans and features ({plans.length} total)
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90 gap-2"
          onClick={handleCreate}
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          Loading pricing plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No pricing plans found. Create your first plan to get started.
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Display Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-xs text-muted-foreground">{plan.planCode}</span>
                      {plan.description && (
                        <span className="text-xs text-muted-foreground mt-1">{plan.description}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {plan.isTrial ? "Free" : `₦${plan.price.toLocaleString('en-NG')}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {plan.billingCycle === "yearly" ? "per year" : "per month"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {plan.isActive ? (
                        <Badge variant="default" className="w-fit">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="w-fit">Inactive</Badge>
                      )}
                      {plan.isTrial && (
                        <Badge variant="outline" className="w-fit">Trial</Badge>
                      )}
                      {plan.isPopular && (
                        <Badge variant="default" className="w-fit bg-blue-500">Popular</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="truncate">• {feature.featureText}</li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-xs">+{plan.features.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{plan.displayOrder}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(plan)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? "Edit Pricing Plan" : "Create Pricing Plan"}</DialogTitle>
            <DialogDescription>
              {selectedPlan ? "Update the pricing plan details" : "Create a new pricing plan for your platform"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planCode">Plan Code *</Label>
                <Input
                  id="planCode"
                  value={formData.planCode}
                  onChange={(e) => setFormData({ ...formData, planCode: e.target.value.toUpperCase() })}
                  placeholder="STARTER, BUSINESS, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Starter, Business, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Perfect for small businesses"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (in kobo) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="149000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="NGN"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingCycle">Billing Cycle</Label>
                <Input
                  id="billingCycle"
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                  placeholder="yearly"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trialDays">Trial Days (if trial plan)</Label>
                <Input
                  id="trialDays"
                  type="number"
                  value={formData.trialDays || ""}
                  onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxStaffUsers">Max Staff Users (leave empty for unlimited)</Label>
                <Input
                  id="maxStaffUsers"
                  type="number"
                  value={formData.maxStaffUsers || ""}
                  onChange={(e) => setFormData({ ...formData, maxStaffUsers: parseInt(e.target.value) || undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLocations">Max Locations (leave empty for unlimited)</Label>
                <Input
                  id="maxLocations"
                  type="number"
                  value={formData.maxLocations || ""}
                  onChange={(e) => setFormData({ ...formData, maxLocations: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isTrial"
                  checked={formData.isTrial}
                  onCheckedChange={(checked) => setFormData({ ...formData, isTrial: checked })}
                />
                <Label htmlFor="isTrial">Is Trial Plan</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPopular"
                  checked={formData.isPopular}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                />
                <Label htmlFor="isPopular">Mark as Popular</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  value={featureText}
                  onChange={(e) => setFeatureText(e.target.value)}
                  placeholder="Add a feature..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addFeature()
                    }
                  }}
                />
                <Button type="button" onClick={addFeature} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 mt-2">
                {formData.features?.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{feature.featureText}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.planCode || !formData.name}
              className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {selectedPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the plan "{selectedPlan?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

