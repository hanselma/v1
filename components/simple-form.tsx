"use client"

import type React from "react"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SimpleForm() {
  const [name, setName] = useState("")
  const [gender, setGender] = useState("")
  const [dob, setDob] = useState<Date>()
  const [restDays, setRestDays] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      console.log({
        name,
        gender,
        dob,
        restDays,
      })
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1000)
  }

  if (submitted) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center">
        <h2 className="mb-2 text-xl font-semibold text-green-700">Registration Successful!</h2>
        <p className="mb-4 text-green-600">Thank you for your submission.</p>
        <Button
          onClick={() => {
            setName("")
            setGender("")
            setDob(undefined)
            setRestDays("")
            setSubmitted(false)
          }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Register Another
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-purple-800">
          Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border-purple-200 focus-visible:ring-purple-500"
          placeholder="Enter your full name"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-purple-800">Gender</Label>
        <RadioGroup value={gender} onValueChange={setGender} required className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" className="border-purple-400 text-purple-600" />
            <Label htmlFor="male" className="cursor-pointer">
              Male
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" className="border-purple-400 text-purple-600" />
            <Label htmlFor="female" className="cursor-pointer">
              Female
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label className="text-purple-800">Date of Birth</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start border-purple-200 text-left font-normal hover:bg-purple-50",
                !dob && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-purple-500" />
              {dob ? format(dob, "PPP") : <span>Select date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dob}
              onSelect={setDob}
              initialFocus
              className="rounded-md border border-purple-200"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rest-days" className="text-purple-800">
          Total Rest Days
        </Label>
        <Select value={restDays} onValueChange={setRestDays} required>
          <SelectTrigger id="rest-days" className="border-purple-200">
            <SelectValue placeholder="Select rest days" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Day</SelectItem>
            <SelectItem value="2">2 Days</SelectItem>
            <SelectItem value="3">3 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
            Submitting...
          </>
        ) : (
          "Submit"
        )}
      </Button>
    </form>
  )
}
