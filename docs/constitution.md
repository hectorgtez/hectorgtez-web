# Constitución — hectorgtez-web

1. **Simplicidad del stack**: React + TypeScript + TailwindCSS vía Vite; sin backend ni dependencias innecesarias.
2. **Spec y código**: Cada cambio responde a lo acordado; no se introducen funciones fuera de especificación. Nada se implementa si no está en la spec activa. Si falta una decisión, se para y se pregunta.
3. **Separación de responsabilidades**: La lógica y los datos residen separados de los componentes visuales.
4. **Verificación sin dependencias**: la lógica se prueba con `node --test`, sin instalar paquetes. Prohibido avanzar con tests en rojo. Las interfaces y flows críticos se validan con Chrome DevTools MCP (console y mobile) antes de cerrar una sesión.
5. **Privacidad estricta**: Cero almacenamiento o exposición de datos personales, credenciales o tokens sensibles. localStorage con compatibilidad hacia atrás. Nunca se pierde una sesión.
6. **Idioma y coherencia**: Textos de cara al usuario estrictamente en español; nombres de código en inglés claro y descriptivo.
