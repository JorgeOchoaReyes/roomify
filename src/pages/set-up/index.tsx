import { useEffect, useState, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, ChevronLeft, CheckCircle, MapPin, Phone, House, HomeIcon, Loader2 } from "lucide-react";
import Head from "next/head";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { api } from "~/utils/api";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { useRouter } from "next/router"; 
import { useSetup } from "~/hooks/use-setup";

const setupSchema = z.object({
  zipcode: z.string().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid US zipcode"),
  phone: z.string().regex(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/, "Please enter a valid phone number"),
  lookingFor: z.enum(["roommate", "renting", "both"], {
    errorMap: () => ({ message: "Please select an option" }),
  }).nullable(),
  locationSeekingZipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid US zipcode"),
});

type SetupFormValues = z.infer<typeof setupSchema>

export default function SetupPage() {
  const {has_user_been_onboarded, has_user_completed_survey} = useSetup();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<SetupFormValues>>({
    zipcode: "",
    phone: "",
    lookingFor: null,
    locationSeekingZipCode: "",
  });
  const [isComplete, setIsComplete] = useState(false);
  const setupProfile = api.setUp.setupProfile.useMutation();

  useEffect(() => {
    if (has_user_been_onboarded && has_user_completed_survey) {
      (async () => await router.push("/dashboard"))();
    } else if (has_user_been_onboarded && !has_user_completed_survey) {
      (async () => await router.push("/set-up/chat"))();
    }
  }, [has_user_been_onboarded, has_user_completed_survey, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    mode: "onChange",
    defaultValues: formData,
  });

  const onSubmit = async (data: SetupFormValues) => {
    setFormData({
      ...formData,
      zipcode: data.zipcode,
      phone: data.phone,
      lookingFor: formData.lookingFor ?? "roommate",
      locationSeekingZipCode: data.locationSeekingZipCode,
    }); 
    const result = await setupProfile.mutateAsync({
      zipCode: data.zipcode,
      phone: data.phone,
      lookingFor: data.lookingFor ?? "roommate",
      locationSeekingZipCode: data.locationSeekingZipCode,
    });
    if (result.success) {
      toast.success("Profile updated successfully");
      setIsComplete(true);
    } else {
      setIsComplete(false);
      toast.error(result.messages.join(", "));
    }
  };

  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const formatPhoneNumber = (value: string) => { 
    const phoneNumber = value.replace(/\D/g, "");
    if (phoneNumber.length < 4) return phoneNumber;
    if (phoneNumber.length < 7) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  return (
    <>
      <Head>
        <title>Account Setup</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800">Account Setup</h1>
            <p className="text-gray-600 mt-2">{"Let's "}get your account ready</p>
          </div> 
          {!isComplete ? (
            <div className="relative"> 
              <div className="mb-8">
                <div className="flex justify-between">
                  <div className={`text-sm ${step >= 1 ? "text-primary" : "text-gray-400"}`}>Location</div>
                  <div className={`text-sm ${step >= 2 ? "text-primary" : "text-gray-400"}`}>Contact</div>
                  <div className={`text-sm ${step >= 3 ? "text-primary" : "text-gray-400"}`}>Details</div>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: "50%" }}
                    animate={{ width: `${(step)/4 * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                          <MapPin className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Where are you located?</h2>
                        <p className="text-gray-600 text-sm mt-1">{"We'll"} use this to provide local services</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zipcode">Zipcode</Label>
                        <Input
                          id="zipcode"
                          placeholder="Enter your zipcode"
                          formProps={{
                            ...register("zipcode")
                          }} 
                          className={errors.zipcode ? "border-red-500" : ""}
                        />
                        {errors.zipcode && <p className="text-red-500 text-sm mt-1">{errors.zipcode.message}</p>}
                      </div>

                      <div className="pt-4">
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="w-full"
                          disabled={!formData.zipcode && !!errors.zipcode}
                        >
                          Continue
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )} 
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                          <Phone className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">{"What's"} your phone number?</h2>
                        <p className="text-gray-600 text-sm mt-1">{"We'll"} use this to send important updates</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="(123) 456-7890" 
                          formProps={{...register("phone", {
                            onChange: (e: ChangeEvent<HTMLInputElement>) => { 
                              const formattedValue = formatPhoneNumber(e.target.value);
                              e.target.value = formattedValue;
                            },
                          })}}
                          className={errors.phone ? "border-red-500" : ""}
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                      </div>
                      <div className="pt-4 flex space-x-3">
                        <Button type="button" onClick={prevStep} variant="outline" className="flex-1">
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button> 
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="flex-1"
                          disabled={!formData.phone && !!errors.phone}
                        >
                          Continue
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )} 
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="text-center mb-6">
                        <div className="flex flex-row items-center justify-center space-x-4 mb-4">
                          <div className={cn(
                            "inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10",
                            formData.lookingFor === "renting" ? "scale-125" : ""
                          )}>
                            <House className={
                              cn(
                                "h-8 w-8 text-primary transition-all",
                                formData.lookingFor === "renting" ? "text-primary" : "text-gray-400"
                              )
                            } />
                          </div> 
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          </div> 
                          <div className={cn(
                            "inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10",
                            formData.lookingFor !== "renting" ? "scale-125" : ""
                          )}>
                            <FaMagnifyingGlass className={cn("h-8 w-8 text-primary transition-all",formData.lookingFor !== "renting" ? "text-primary" : "text-gray-400")
                            } />
                          </div>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">{"Are you renting or looking for roomates?"}</h2> 
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone"></Label>
                        <div className="flex items-center space-x-4">
                          <Button
                            type="button" 
                            onClick={() => setFormData({ ...formData, lookingFor: "renting" })}
                            className={cn("w-1/2 hover:text-white",formData.lookingFor === "renting" ? "bg-primary text-white" : "bg-gray-100 text-gray-800")}
                          >
                            <HomeIcon/> Renting
                          </Button>
                          <Button
                            type="button" 
                            onClick={() => setFormData({ ...formData, lookingFor: "roommate" })}
                            className={cn("w-1/2 hover:text-white",formData.lookingFor !== "renting" ? "bg-primary text-white" : "bg-gray-100 text-gray-800")}
                          >
                            <FaMagnifyingGlass /> Roommate
                          </Button>
                        </div>
                      </div>
                      <div className="pt-4 flex space-x-3">
                        <Button type="button" onClick={prevStep} variant="outline" className="flex-1">
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button> 
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="flex-1"
                          disabled={!formData.lookingFor && !!errors.lookingFor}
                        >
                          Continue
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    > 
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                          <MapPin className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">What area are you interested in finding renters/roommates?</h2> 
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zipcode">Zipcode</Label>
                        <Input
                          id="locationSeekingZipCode"
                          placeholder="Enter your zipcode"
                          formProps={{
                            ...register("locationSeekingZipCode")
                          }} 
                          className={errors.zipcode ? "border-red-500" : ""}
                        />
                        {errors.zipcode && <p className="text-red-500 text-sm mt-1">{errors.zipcode.message}</p>}
                      </div>

                      <div className="pt-4 flex space-x-3">
                        <Button type="button" onClick={prevStep} variant="outline" className="flex-1">
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button> 
                        <Button type="submit" variant="outline" className="flex-1 bg-primary text-white">
                          {setupProfile.isPaused ? <Loader2 className="animate-spin" /> : "Submit"}
                        </Button> 
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-8"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Setup Complete!</h2>
              <p className="text-gray-600 mb-6">
                Your account has been successfully set up with the following information:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Zipcode:</span>
                  <span className="font-medium">{formData.zipcode}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{formData.phone}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200">
                  <span className="text-gray-600">Looking for:</span>
                  <span className="font-medium">{formData.lookingFor}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Location Seeking Zipcode:</span>
                  <span className="font-medium">{formData.locationSeekingZipCode}</span>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                {"Thank you for setting up your account! You can now start using the app."}
              </p>
              <p className="text-gray-600 mb-6">
                {"Please complete the quick survey to help us understand what you're looking for."}
              </p>
              <Button className="w-full" onClick={async () => {
                await router.push("/set-up/chat");
              }}>Complete Quick Survey</Button>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
