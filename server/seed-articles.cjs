require('dotenv').config({ path: __dirname + '/.env' });
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const AUTHOR_NAME = 'Fernando Baccari';

const articles = [
  {
    title: 'Cómo hacer prospección B2B efectiva en 2026',
    category: 'Guía',
    excerpt: 'El mercado está saturado y los decisores ya no responden al volumen. Descubre cómo construir un sistema de prospección B2B que genera pipeline de forma predecible.',
    cover_image: '/uploads/b2b_prospecting_2026.png',
    content: `<h2>Introducción</h2>
<p>La prospección B2B en 2026 ya no funciona con volumen. El mercado está saturado: los decisores reciben decenas de mensajes al día y su atención es un recurso escaso. Quien sigue enviando mensajes genéricos en masa no solo no obtiene respuestas, sino que daña su reputación comercial.</p>
<p>La buena noticia es que esta saturación también crea una oportunidad enorme para quienes adoptan un enfoque estratégico. La calidad, la relevancia y la consistencia ganan siempre frente al volumen.</p>

<h2>Qué es la prospección B2B</h2>
<p>La prospección B2B es el proceso sistematizado de identificar, contactar y generar oportunidades con potenciales clientes empresariales. Su objetivo no es vender directamente, sino <strong>abrir conversaciones relevantes</strong> que puedan evolucionar hacia oportunidades reales de negocio.</p>
<p>Un error común es confundir prospección con venta. La prospección termina cuando hay una reunión agendada. Lo que viene después es otra disciplina.</p>

<h2>Errores comunes que debes evitar</h2>
<ul>
<li><strong>Falta de foco:</strong> intentar hablar con todos equivale a no hablar con nadie. Sin un Perfil de Cliente Ideal (ICP) definido, tus esfuerzos se dispersan.</li>
<li><strong>Mensajes genéricos:</strong> un mensaje que podría enviarse a cualquier empresa no conecta con ninguna. La personalización no es opcional.</li>
<li><strong>Ausencia de sistema:</strong> la prospección espontánea genera resultados esporádicos. Sin cadencia y seguimiento, las oportunidades se pierden.</li>
<li><strong>Medir solo actividad:</strong> hacer muchas llamadas o enviar muchos emails no es éxito. Lo que importa es cuántas conversaciones relevantes se generan.</li>
</ul>

<h2>Cómo estructurar una prospección B2B efectiva</h2>
<p><strong>1. Define tu ICP con precisión.</strong> Sector, tamaño de empresa, cargo del decisor, problemas específicos que resuelves. Cuanto más específico, más efectivo.</p>
<p><strong>2. Construye listas cualificadas.</strong> No compres bases de datos masivas. Identifica empresas con señales de intención: crecimiento reciente, cambios de liderazgo, expansión a nuevos mercados.</p>
<p><strong>3. Diseña una cadencia multicanal.</strong> Combina LinkedIn, email y teléfono en una secuencia estructurada que genere múltiples puntos de contacto sin resultar invasive.</p>
<p><strong>4. Personaliza de forma escalable.</strong> Investiga a tus prospectos, menciona algo específico de su empresa o contexto. No necesitas escribir cada mensaje desde cero, pero sí añadir un elemento genuinamente relevante.</p>
<p><strong>5. Mide y ajusta constantemente.</strong> Tasas de respuesta, de conversión a reunión, de progresión. Los datos te dicen qué funciona y qué no.</p>

<h2>Conclusión</h2>
<p>La prospección B2B efectiva en 2026 no es una cuestión de volumen, sino de sistema. Las empresas que lo entienden generan pipeline de forma predecible, independientemente del ciclo del mercado. Las que no lo entienden dependen de la suerte.</p>
<p>Construir ese sistema lleva tiempo, pero los resultados son duraderos y escalables.</p>`
  },
  {
    title: 'Prospección en LinkedIn: guía completa para 2026',
    category: 'Guía',
    excerpt: 'LinkedIn es el canal B2B más potente hoy en día. Pero su saturación obliga a cambiar el enfoque. Aquí tienes la guía completa para prospectar con inteligencia.',
    cover_image: '/uploads/linkedin_prospecting.png',
    content: `<h2>Introducción</h2>
<p>LinkedIn se ha convertido en el canal de referencia para la prospección B2B. Sin embargo, su popularidad también ha generado un problema: la saturación. Los decisores reciben solicitudes de conexión genéricas y mensajes de venta directa desde el primer contacto a diario. El resultado es que la mayoría se ignoran.</p>
<p>Prospectar bien en LinkedIn en 2026 requiere un cambio de mentalidad: de la cantidad a la precisión, del mensaje de ventas a la conversación de valor.</p>

<h2>Optimización del perfil: tu primera impresión</h2>
<p>Antes de contactar a nadie, asegúrate de que tu perfil transmite credibilidad. Tu perfil no es un CV, es una <strong>herramienta de conversión</strong>. Debe responder a tres preguntas en los primeros segundos:</p>
<ul>
<li>¿Qué haces exactamente?</li>
<li>¿Para quién lo haces?</li>
<li>¿Por qué deberían confiar en ti?</li>
</ul>
<p>El titular, la foto y el resumen son los elementos que más impacto tienen. Un titular como "Ayudo a equipos de ventas B2B a generar reuniones cualificadas" comunica valor de forma inmediata.</p>

<h2>Estrategia de contacto: observa antes de actuar</h2>
<p>El error más común en LinkedIn es pasar directamente al mensaje sin ninguna interacción previa. El resultado es un mensaje frío en el sentido más literall.</p>
<p>Una estrategia más efectiva consiste en:</p>
<ol>
<li>Identificar al prospecto ideal con Sales Navigator o búsquedas avanzadas.</li>
<li>Interactuar con su contenido de forma genuina (comentarios con valor, no emojis).</li>
<li>Enviar solicitud de conexión con nota personalizada y contextualizada.</li>
<li>Iniciar conversación cuando la conexión sea aceptada, sin intentar vender en el primer mensaje.</li>
</ol>

<h2>Mensajes efectivos: cortos, relevantes y con propósito</h2>
<p>Los mejores mensajes de LinkedIn comparten tres características:</p>
<ul>
<li><strong>Cortos:</strong> menos de 5 líneas. Si puedes resumirlo más, resúmelo.</li>
<li><strong>Relevantes:</strong> hacen referencia a algo específico del prospecto o su empresa.</li>
<li><strong>Con propósito claro:</strong> una sola llamada a la acción, simple y de bajo compromiso.</li>
</ul>
<p>Ejemplo: "Hola [Nombre], vi que [empresa] está expandiendo su equipo comercial. Trabajo con empresas similares en estructurar su proceso de prospección. ¿Te interesaría intercambiar opiniones en una llamada corta?"</p>

<h2>Conclusión</h2>
<p>LinkedIn no es un canal de volumen. Es un canal de precisión. Quienes lo tratan como tal generan conversaciones de calidad con los decisores correctos. Quienes lo usan para spam acelerado únicamente dañan su reputación profesional.</p>
<p>La clave está en construir relaciones antes de intentar vender.</p>`
  },
  {
    title: 'Cómo escribir emails en frío que generan respuestas',
    category: 'Blog',
    excerpt: 'El email sigue siendo uno de los canales más efectivos en prospección B2B. Pero el 90% falla por los mismos motivos. Aquí está la diferencia entre un email que se lee y uno que va directo a la papelera.',
    cover_image: '/uploads/cold_email.png',
    content: `<h2>Introducción</h2>
<p>El email frío tiene mala reputación, y en muchos casos merecida. La mayoría de los emails de prospección que llegan a una bandeja de entrada son largos, genéricos, centrados en quien los envía y terminan con un "¿tienes 30 minutos para una llamada?" que nadie espera.</p>
<p>Sin embargo, cuando se hace bien, el email sigue siendo uno de los canales de mayor retorno en prospección B2B. La diferencia está en el enfoque.</p>

<h2>Las claves de un email que funciona</h2>
<p><strong>Asunto que genera apertura:</strong> el asunto es lo único que el prospecto ve antes de decidir si abre o no. Debe ser específico, relevante y no parecer publicidad. Evita asuntos genéricos como "Oportunidad de colaboración". Prefiere algo concreto: "Sobre el proceso de prospección en [empresa]".</p>
<p><strong>Personalización real:</strong> no es suficiente con insertar el nombre. La personalización real implica mencionar algo específico: un artículo que publicó, un cambio en la empresa, una noticia del sector. Eso demuestra que no eres un robot.</p>
<p><strong>Brevedad:</strong> un email de prospección efectivo cabe en la pantalla de un móvil sin hacer scroll. Si tu email necesita más de 5 frases, es demasiado largo.</p>
<p><strong>CTA simple:</strong> no pidas 30 minutos en el primer email. Pide algo de bajo compromiso: una opinión, una confirmación, una respuesta corta.</p>

<h2>Ejemplo práctico</h2>
<p>En lugar de:</p>
<blockquote>"Somos una empresa líder en soluciones de ventas con más de 10 años de experiencia. Nuestros clientes han mejorado sus resultados un 40%. ¿Tienes 30 minutos esta semana para que te cuente más?"</blockquote>
<p>Prueba esto:</p>
<blockquote>"Hola [Nombre], vi que [empresa] está contratando varios SDRs este trimestre. Trabajo con equipos en tu situación para estructurar su proceso de prospección desde el inicio. ¿Es algo en lo que estáis trabajando ahora mismo?"</blockquote>
<p>La diferencia es clara: el segundo habla del prospecto, no de quien envía el email.</p>

<h2>Errores comunes que debes eliminar</h2>
<ul>
<li>Emails de más de 150 palabras.</li>
<li>Lenguaje corporativo y clichés ("soluciones innovadoras", "líder del mercado").</li>
<li>Hablar de tu empresa antes de hablar del problema del cliente.</li>
<li>Múltiples llamadas a la acción en el mismo email.</li>
<li>Seguimientos automáticos sin personalización.</li>
</ul>

<h2>Conclusión</h2>
<p>Un buen email frío genera curiosidad. No vende directamente, no presenta tu empresa, no pide demasiado. Simplemente abre una puerta.</p>
<p>Si consigues que el prospecto piense "esto es relevante para mí", has conseguido el objetivo del primer email.</p>`
  },
  {
    title: 'Cadencia de prospección: cómo estructurar tu outreach',
    category: 'Estrategia',
    excerpt: 'Una acción aislada no es prospección. La cadencia es el sistema que convierte contactos esporádicos en oportunidades consistentes. Aprende a estructurar la tuya.',
    cover_image: '/uploads/cadencia.png',
    content: `<h2>Introducción</h2>
<p>La mayoría de los equipos comerciales prospectan de forma reactiva: envían un email, esperan unos días, y si no hay respuesta, pasan al siguiente. Ese enfoque genera resultados esporádicos y dependientes de la suerte.</p>
<p>La cadencia de prospección es la solución. Es el elemento que convierte acciones aisladas en un sistema estructurado, predecible y medible.</p>

<h2>Qué es una cadencia de prospección</h2>
<p>Una cadencia es una <strong>secuencia de contactos planificada en el tiempo</strong>, distribuida en múltiples canales, con un objetivo claro en cada paso. No es spam. Es un proceso diseñado para maximizar la probabilidad de que el mensaje correcto llegue al prospecto en el momento adecuado.</p>
<p>Una cadencia bien diseñada respeta el tiempo del prospecto, aporta valor en cada contacto y tiene un final definido.</p>

<h2>Ejemplo de cadencia multicanal (10 días)</h2>
<ul>
<li><strong>Día 1:</strong> Solicitud de conexión en LinkedIn con nota personalizada.</li>
<li><strong>Día 3:</strong> Mensaje en LinkedIn si acepta la conexión (presentación breve y propuesta de valor).</li>
<li><strong>Día 5:</strong> Email frío personalizado con referencia al contexto específico del prospecto.</li>
<li><strong>Día 7:</strong> Llamada telefónica — si hay buzón, dejar mensaje corto y directo.</li>
<li><strong>Día 10:</strong> Email de seguimiento o "breakup email" con tono natural y sin presión.</li>
</ul>
<p>Esta estructura asegura múltiples puntos de contacto sin resultar invasiva, y permite identificar el canal preferido de cada prospecto.</p>

<h2>Principios de una cadencia efectiva</h2>
<p><strong>Consistencia:</strong> la cadencia debe ejecutarse tal como se diseñó. La improvisación mata los sistemas.</p>
<p><strong>Multicanalidad:</strong> no dependas de un solo canal. Los prospectos tienen diferentes preferencias de comunicación.</p>
<p><strong>Personalización en cada paso:</strong> cada contacto debe tener un motivo claro y relevante para el prospecto, no una copia del anterior.</p>
<p><strong>Adaptación basada en datos:</strong> revisa regularmente qué pasos generan más respuesta y ajusta la cadencia en consecuencia.</p>

<h2>Cuándo termina una cadencia</h2>
<p>Una cadencia debe tener un punto final. Continuar indefinidamente después de múltiples intentos sin respuesta no es perseverancia, es falta de sistema. Un buen "breakup email" — cortés, directo y sin presión — a veces genera más respuestas que todos los intentos anteriores juntos.</p>

<h2>Conclusión</h2>
<p>Sin cadencia no hay sistema. Sin sistema no hay resultados predecibles. Construir una cadencia sólida requiere planificación inicial, pero los beneficios son inmediatos: más consistencia, menos dependencia de la memoria y resultados medibles.</p>
<p>El objetivo final es que tu prospección funcione incluso los días en que no tienes motivación.</p>`
  },
  {
    title: 'El rol del SDR en 2026: más estratégico, menos operativo',
    category: 'Blog',
    excerpt: 'La automatización ha cambiado el rol del SDR para siempre. Las tareas repetitivas se delegan a la tecnología; lo que queda es más exigente, más valioso y más humano.',
    cover_image: '/uploads/sdr_2026.png',
    content: `<h2>Introducción</h2>
<p>El rol del Sales Development Representative (SDR) está viviendo una transformación profunda. Durante años, el SDR fue sinónimo de volumen: muchas llamadas, muchos emails, mucha actividad. La efectividad se medía en número de touchpoints, no en calidad de las conversaciones.</p>
<p>En 2026, ese modelo ya no funciona. Y no es por falta de esfuerzo, sino porque el mercado ha cambiado.</p>

<h2>Qué ha cambiado en el entorno del SDR</h2>
<p><strong>La automatización elimina las tareas repetitivas.</strong> Los SDRs ya no necesitan dedicar horas a buscar datos de contacto, enviar emails uno a uno o registrar actividad manualmente. Las herramientas de IA y automatización se encargan de eso.</p>
<p><strong>Los prospectos están mejor informados.</strong> Antes de responder a cualquier contacto, el decisor ya ha investigado tu empresa, leído reseñas y comparado opciones. El SDR ya no es la primera fuente de información.</p>
<p><strong>La tolerancia al spam es cero.</strong> Los filtros de email, las restricciones de LinkedIn y la fatiga de los decisores hacen que los mensajes genéricos simplemente no lleguen o no se lean.</p>

<h2>Las habilidades clave del SDR en 2026</h2>
<p><strong>Pensamiento estratégico:</strong> el SDR moderno sabe priorizar. Identifica señales de intención, elige los prospectos con mayor probabilidad de conversión y diseña aproximaciones personalizadas.</p>
<p><strong>Claridad en la comunicación:</strong> la capacidad de transmitir valor de forma concisa, relevante y sin jargon corporativo es la habilidad más diferenciadora en el mercado actual.</p>
<p><strong>Uso inteligente de la tecnología:</strong> no se trata de usar más herramientas, sino de usar las correctas de forma estratégica. La IA amplifica a los buenos SDRs y expone a los que dependían solo del volumen.</p>
<p><strong>Adaptabilidad cultural:</strong> especialmente en mercados del sur de Europa y Latinoamérica, la capacidad de entender el contexto cultural y adaptar el tono y el ritmo es un diferenciador crítico.</p>

<h2>Qué diferencia al SDR top</h2>
<p>El SDR de alto rendimiento en 2026 no busca hacer más. Busca hacer mejor. Genera <strong>conversaciones de valor</strong>, no actividad. Sus métricas no son llamadas por día, sino reuniones cualificadas por semana.</p>
<p>Entiende que su trabajo no es vender, sino crear las condiciones para que el Account Executive pueda vender. Y eso requiere criterio, no solo ejecución.</p>

<h2>Conclusión</h2>
<p>El futuro del SDR es más inteligente, no más operativo. La automatización no elimina el rol, sino que eleva el listón de lo que se espera de él.</p>
<p>Quien invierta en desarrollar las habilidades correctas — pensamiento estratégico, comunicación clara, inteligencia cultural — encontrará que el rol del SDR es uno de los más valiosos y mejor pagados en ventas B2B.</p>`
  }
];

db.get('SELECT id FROM users WHERE email = ?', ['baraccoy@gmail.com'], (err, author) => {
  if (err || !author) {
    console.error('Superadmin not found. Run seed-superadmin.cjs first.');
    process.exit(1);
  }

  const stmt = db.prepare(`
    INSERT INTO articles (title, content, excerpt, category, cover_image, author_id, author_name, published)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  articles.forEach((art, i) => {
    stmt.run(art.title, art.content, art.excerpt, art.category, art.cover_image, author.id, AUTHOR_NAME, function(err) {
      if (err) console.error(`❌ Error article ${i+1}:`, err.message);
      else console.log(`✅ Article ${i+1} published: "${art.title}" (id: ${this.lastID})`);
    });
  });

  stmt.finalize(() => {
    console.log('\n🎉 All 5 articles published successfully!');
    db.close();
  });
});
