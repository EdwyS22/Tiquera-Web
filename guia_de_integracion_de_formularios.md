# Guía Rápida: Integración de Formularios en Frontend

Esta guía explica cómo conectar y gestionar formularios en un proyecto web (React, HTML/JS) utilizando servicios sin backend (*Form Endpoints*), incrustaciones (*Embeds*) o consumo de API propio.

---

## 🚀 Opción 1: Servicio Endpoint Directo (Formspree / Web3Forms)

Ideal si quieres mantener un diseño personalizado y enviar las respuestas directamente por correo o a un gestor sin programar backend.

### Pasos de Configuración:
1. Crear una cuenta en un servicio como [Formspree](https://formspree.io/f/xbggpklg)
2. Crear un nuevo formulario y copiar el **Endpoint URL** generado (`https://formspree.io/f/TU_FORM_ID`).

### Ejemplo en React (JSX):

```jsx
import React, { useState } from 'react';

export default function ContactForm() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    const form = e.target;
    const data = new FormData(form);

    try {
      const response = await fetch('https://formspree.io/f/TU_FORM_ID', {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setStatus('¡Mensaje enviado con éxito!');
        form.reset();
      } else {
        setStatus('Ocurrió un error al enviar el formulario.');
      }
    } catch (error) {
      setStatus('Error de red al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-md mx-auto border rounded-lg shadow-sm">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input 
          type="text" 
          name="name" 
          required 
          className="w-full border rounded p-2 text-gray-900" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
        <input 
          type="email" 
          name="email" 
          required 
          className="w-full border rounded p-2 text-gray-900" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Mensaje</label>
        <textarea 
          name="message" 
          required 
          rows="4" 
          className="w-full border rounded p-2 text-gray-900"
        ></textarea>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar'}
      </button>

      {status && <p className="mt-2 text-sm text-center font-medium text-gray-700">{status}</p>}
    </form>
  );
}
```

---

## 📦 Opción 2: Formulario Incrustado (Breeze Forms / Typeform / Google Forms)

Ideal si utilizas una herramienta no-code o gestor de tareas (como Breeze.pm) y quieres incrustar la vista directamente.

```jsx
import React from 'react';

export default function EmbeddedForm() {
  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      <iframe
        src="https://breeze.pm/forms/YOUR_FORM_ID"
        title="Formulario de contacto"
        className="w-full h-[600px] border-0 rounded-lg shadow-md"
        allow="autoplay"
      ></iframe>
    </div>
  );
}
```

---

## ⚡ Opción 3: Consumo de API Propia (JSON Fetch)

Si tu proyecto cuenta con un backend personalizado (Node.js, Python, Laravel, etc.):

```javascript
const sendFormData = async (formData) => {
  try {
    const response = await fetch('https://api.tu-dominio.com/v1/contacto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) throw new Error('Error en la respuesta del servidor');
    return await response.json();
  } catch (error) {
    console.error('Error al enviar:', error);
    throw error;
  }
};
```

---

## 📌 Recomendaciones y Buenas Prácticas

1. **Atributo `name` obligatorio:** Asegúrate de que cada `<input>`, `<select>` y `<textarea>` tenga un atributo `name` único, ya que los servicios lo usan como clave de los datos.
2. **Validación:** Aprovecha las validaciones nativas de HTML (`required`, `type="email"`, `pattern`) antes de enviar la petición.
3. **Variables de Entorno:** Evita colocar las claves de API o IDs directamente en el código fuente de producción; usa variables de entorno (`.env`).