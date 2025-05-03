
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { CustomizationSettings } from "@/types";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

const defaultSettings: Partial<CustomizationSettings> = {
  business_name: "Mi Negocio",
  welcome_title: "Reserva tu cita en minutos",
  welcome_subtitle: "Selecciona el servicio que necesitas, elige una fecha y hora disponible, y reserva tu cita de forma rápida y sencilla.",
  booking_instructions: "Para reservar, selecciona un servicio, fecha y hora disponible.",
  hero_image_url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2684&auto=format&fit=crop",
  primary_color: "#9b87f5",
  business_name_color: "#000000",
  welcome_title_color: "#000000",
  welcome_subtitle_color: "#000000",
  booking_instructions_color: "#000000"
};

const Personalizacion = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<CustomizationSettings> | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState("");

  const form = useForm<Partial<CustomizationSettings>>({
    defaultValues: defaultSettings
  });
  
  const watchHeroImageUrl = form.watch("hero_image_url");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("customization_settings")
          .select("*")
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data) {
          setSettings(data);
          form.reset(data);
          setPreviewImageUrl(data.hero_image_url || "");
        } else {
          form.reset(defaultSettings);
          setPreviewImageUrl(defaultSettings.hero_image_url || "");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Error al cargar la configuración");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (watchHeroImageUrl) {
      setPreviewImageUrl(watchHeroImageUrl);
    }
  }, [watchHeroImageUrl]);

  const onSubmit = async (data: Partial<CustomizationSettings>) => {
    try {
      setSaving(true);
      
      if (settings?.id) {
        // Update existing settings
        const { error } = await supabase
          .from("customization_settings")
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from("customization_settings")
          .insert([{
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      toast.success("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Personalización</h2>
        <p className="text-muted-foreground">
          Personaliza la apariencia de la página de reserva de citas para tus clientes.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Información General</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Negocio</CardTitle>
                  <CardDescription>
                    Configura la información principal que verán tus clientes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="business_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Negocio</FormLabel>
                        <FormControl>
                          <Input placeholder="Mi Negocio" {...field} />
                        </FormControl>
                        <FormDescription>
                          Este nombre aparecerá en la página principal.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="welcome_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título de Bienvenida</FormLabel>
                        <FormControl>
                          <Input placeholder="Reserva tu cita en minutos" {...field} />
                        </FormControl>
                        <FormDescription>
                          Título principal que verán tus clientes.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="welcome_subtitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtítulo de Bienvenida</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Selecciona el servicio que necesitas..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Texto descriptivo que aparecerá bajo el título.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="booking_instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instrucciones de Reserva</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Para reservar, selecciona un servicio..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Instrucciones para el proceso de reserva.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                  <FormField
                    control={form.control}
                    name="business_name_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color del Nombre del Negocio</FormLabel>
                        <FormControl>
                          <input type="color" {...field} className="w-12 h-10 cursor-pointer" />
                        </FormControl>
                        <FormDescription>Color del texto para el nombre del negocio.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="welcome_title_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color del Título de Bienvenida</FormLabel>
                        <FormControl>
                          <input type="color" {...field} className="w-12 h-10 cursor-pointer" />
                        </FormControl>
                        <FormDescription>Color del texto para el título de bienvenida.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="welcome_subtitle_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color del Subtítulo de Bienvenida</FormLabel>
                        <FormControl>
                          <input type="color" {...field} className="w-12 h-10 cursor-pointer" />
                        </FormControl>
                        <FormDescription>Color del subtítulo debajo del título principal.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="booking_instructions_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color de las Instrucciones de Reserva</FormLabel>
                        <FormControl>
                          <input type="color" {...field} className="w-12 h-10 cursor-pointer" />
                        </FormControl>
                        <FormDescription>Color del texto para las instrucciones del proceso de reserva.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Apariencia Visual</CardTitle>
                  <CardDescription>
                    Personaliza los elementos visuales de tu página.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="hero_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de Imagen Principal</FormLabel>
                        <FormControl>
                          <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL de la imagen que aparecerá en la página principal.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {previewImageUrl && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Vista previa de la imagen:</p>
                      <div className="relative w-full h-48 overflow-hidden rounded-lg border">
                        <div 
                          className="w-full h-full bg-center bg-cover" 
                          style={{ backgroundImage: `url(${previewImageUrl})` }}
                        />
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="primary_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Principal</FormLabel>
                        <div className="flex items-center gap-4">
                          <FormControl>
                            <Input type="text" placeholder="#9b87f5" {...field} />
                          </FormControl>
                          <Input 
                            type="color" 
                            value={field.value || "#9b87f5"} 
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                        </div>
                        <FormDescription>
                          Color principal para botones y elementos destacados.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vista Previa</CardTitle>
                  <CardDescription>
                    Visualiza cómo quedará tu página con los cambios aplicados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border rounded-lg overflow-hidden">
                    <div 
                      className="w-full h-48 bg-center bg-cover relative" 
                      style={{ backgroundImage: `url(${form.watch("hero_image_url") || defaultSettings.hero_image_url})` }}
                    >
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center">
                        <h1 className="text-2xl font-bold mb-2" style={{ color: form.watch("business_name_color") || "#000000" }}>{form.watch("business_name") || defaultSettings.business_name}</h1>
                        <h2 className="text-xl font-semibold" style={{ color: form.watch("welcome_title_color") || "#000000" }}>{form.watch("welcome_title") || defaultSettings.welcome_title}</h2>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-muted-foreground mb-4" style={{ color: form.watch("welcome_subtitle_color") || "#000000" }}>
                        {form.watch("welcome_subtitle") || defaultSettings.welcome_subtitle}
                      </p>
                      <Separator className="my-4" />
                      <div className="flex justify-center">
                        <Button 
                          style={{ 
                            backgroundColor: form.watch("primary_color") || defaultSettings.primary_color,
                            borderColor: form.watch("primary_color") || defaultSettings.primary_color
                          }}
                        >
                          Reservar Cita
                        </Button>
                      </div>
                      <div className="mt-6 p-4 bg-muted rounded-md">
                        <h3 className="font-medium mb-2">Instrucciones:</h3>
                        <p className="text-sm text-muted-foreground" style={{ color: form.watch("booking_instructions_color") || "#000000" }}>
                          {form.watch("booking_instructions") || defaultSettings.booking_instructions}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default Personalizacion;
