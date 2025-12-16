import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ticket, Shield, AlertTriangle, Users, Scale, FileText } from 'lucide-react';

const TermsPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-slate-700 hover:text-sky-700 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            <Link to="/" className="flex items-center space-x-2">
              <Ticket className="w-8 h-8 text-sky-600" />
              <span className="text-xl font-bold text-slate-900">RafflyWin</span>
            </Link>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Title */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Scale className="w-10 h-10 text-sky-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                Términos y Condiciones
              </h1>
            </div>
            <p className="text-slate-600">
              Última actualización: Diciembre 2025
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-800 mb-2">Aviso Importante</h3>
                <p className="text-amber-700 text-sm">
                  Al crear una cuenta en RafflyWin, usted declara bajo juramento que es mayor de 21 años, 
                  acepta estos términos y condiciones en su totalidad, y comprende las implicaciones 
                  legales de participar en rifas y sorteos en línea.
                </p>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-8 text-slate-700">
            
            {/* Section 1 */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-sky-600" />
                <h2 className="text-xl font-bold text-slate-900">1. Aceptación de los Términos</h2>
              </div>
              <div className="pl-7 space-y-3">
                <p>
                  Al acceder, registrarse o utilizar la plataforma RafflyWin ("la Plataforma"), usted acepta 
                  estos Términos y Condiciones ("TyC") de manera íntegra y sin reservas. Si no está de 
                  acuerdo con alguna parte de estos términos, no podrá crear una cuenta ni utilizar 
                  nuestros servicios.
                </p>
                <p>
                  RafflyWin se reserva el derecho de modificar estos TyC en cualquier momento. Las 
                  modificaciones serán efectivas desde su publicación en la Plataforma. El uso continuado 
                  de los servicios después de cualquier modificación constituye su aceptación de los 
                  nuevos términos.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-sky-600" />
                <h2 className="text-xl font-bold text-slate-900">2. Requisitos de Edad y Elegibilidad</h2>
              </div>
              <div className="pl-7 space-y-3">
                <p className="font-semibold text-red-700">
                  Para utilizar RafflyWin, usted debe tener al menos 21 años de edad.
                </p>
                <p>
                  Al crear una cuenta, usted certifica y declara bajo juramento que:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Es mayor de 21 años de edad.</li>
                  <li>Tiene capacidad legal para celebrar contratos vinculantes en su jurisdicción.</li>
                  <li>Comprende plenamente las implicaciones de participar en juegos de rifas y sorteos.</li>
                  <li>Es consciente de que las rifas implican un elemento de azar y que no hay garantía de obtener un premio.</li>
                  <li>No está participando desde una jurisdicción donde los sorteos o rifas en línea estén prohibidos.</li>
                  <li>No utilizará la Plataforma para actividades ilegales o fraudulentas.</li>
                </ul>
                <p>
                  RafflyWin se reserva el derecho de solicitar documentación que acredite su identidad y 
                  edad en cualquier momento. En caso de que se descubra que un usuario no cumple con 
                  los requisitos de edad, su cuenta será suspendida inmediatamente y cualquier premio 
                  pendiente será anulado.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-5 h-5 text-sky-600" />
                <h2 className="text-xl font-bold text-slate-900">3. Exención de Responsabilidad</h2>
              </div>
              <div className="pl-7 space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-semibold">
                    LEA ESTA SECCIÓN CON ATENCIÓN
                  </p>
                </div>
                
                <h3 className="font-semibold text-slate-900">3.1. Responsabilidad sobre los Premios</h3>
                <p>
                  <strong>RafflyWin actúa únicamente como una plataforma intermediaria</strong> que conecta a 
                  creadores de contenido (organizadores de rifas) con participantes. RafflyWin NO es el 
                  organizador directo de las rifas publicadas por los creadores.
                </p>
                <p className="font-semibold text-red-700">
                  RafflyWin NO se hace responsable si un creador de contenido (organizador de rifa) 
                  decide no entregar el premio prometido, entrega un premio diferente al anunciado, 
                  o incumple de cualquier forma con las condiciones de su rifa.
                </p>
                <p>
                  Cada creador de contenido es el único y exclusivo responsable de:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>La veracidad de la información publicada sobre los premios.</li>
                  <li>La entrega efectiva de los premios a los ganadores.</li>
                  <li>La calidad y estado de los premios entregados.</li>
                  <li>El cumplimiento de todas las condiciones de su rifa.</li>
                  <li>El cumplimiento de las leyes aplicables en su jurisdicción.</li>
                </ul>

                <h3 className="font-semibold text-slate-900 mt-6">3.2. Limitación de Responsabilidad General</h3>
                <p>
                  En la máxima medida permitida por la ley aplicable, RafflyWin, sus directores, empleados, 
                  afiliados y proveedores de servicios no serán responsables por:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Daños directos, indirectos, incidentales, especiales o consecuentes derivados del uso de la Plataforma.</li>
                  <li>Pérdidas económicas derivadas de la participación en rifas.</li>
                  <li>Actos fraudulentos, estafas o incumplimientos por parte de otros usuarios.</li>
                  <li>Interrupciones del servicio, errores técnicos o pérdida de datos.</li>
                  <li>Contenido publicado por los usuarios o terceros.</li>
                  <li>Disputas entre usuarios de la Plataforma.</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-sky-600" />
                <h2 className="text-xl font-bold text-slate-900">4. Sistema de Valoración y Reportes</h2>
              </div>
              <div className="pl-7 space-y-3">
                <p>
                  RafflyWin cuenta con un <strong>sistema de valoración de usuarios</strong> basado en 
                  calificaciones y reseñas de otros miembros de la comunidad. Este sistema está diseñado 
                  para promover la transparencia y ayudar a los usuarios a tomar decisiones informadas.
                </p>
                <p>
                  <strong>Instamos encarecidamente a todos los usuarios a:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Revisar las valoraciones y reputación de los creadores antes de participar en sus rifas.</li>
                  <li>Dejar valoraciones honestas después de participar en una rifa.</li>
                  <li>Reportar cualquier comportamiento sospechoso, fraudulento o que viole estos términos.</li>
                  <li>Comunicarse con nuestro equipo de soporte ante cualquier problema o disputa.</li>
                </ul>
                <p>
                  Las valoraciones y reportes de los usuarios son una herramienta fundamental para mantener 
                  la integridad de la Plataforma. Sin embargo, RafflyWin no garantiza la exactitud de las 
                  valoraciones ni puede verificar todas las transacciones entre usuarios.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-sky-600" />
                <h2 className="text-xl font-bold text-slate-900">5. Conductas Prohibidas y Sanciones</h2>
              </div>
              <div className="pl-7 space-y-3">
                <p className="font-semibold">
                  RafflyWin no apoya, incentiva ni tolera prácticas deshonestas, abusivas o fraudulentas 
                  por parte de ningún usuario.
                </p>
                <p>
                  Están expresamente prohibidas las siguientes conductas:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Crear rifas con premios falsos o que no se tengan intención de entregar.</li>
                  <li>Manipular el resultado de los sorteos de cualquier manera.</li>
                  <li>Crear múltiples cuentas para manipular el sistema.</li>
                  <li>Publicar información falsa o engañosa.</li>
                  <li>Acosar, amenazar o intimidar a otros usuarios.</li>
                  <li>Utilizar bots o sistemas automatizados para participar en rifas.</li>
                  <li>Realizar actividades de lavado de dinero o cualquier actividad ilegal.</li>
                  <li>Suplantar la identidad de otra persona.</li>
                  <li>Violar derechos de propiedad intelectual.</li>
                </ul>
                <p className="font-semibold text-red-700 mt-4">
                  RafflyWin se reserva el derecho de bloquear, suspender temporalmente o eliminar 
                  permanentemente las cuentas de usuarios que realicen cualquiera de estas prácticas, 
                  sin previo aviso y sin derecho a reembolso alguno.
                </p>
                <p>
                  Además, RafflyWin podrá:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Retener fondos pendientes de usuarios sancionados.</li>
                  <li>Reportar actividades ilegales a las autoridades competentes.</li>
                  <li>Emprender acciones legales contra usuarios que causen daños a la Plataforma o a otros usuarios.</li>
                  <li>Compartir información de usuarios fraudulentos con otras plataformas para prevenir fraudes.</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-sky-600" />
                <h2 className="text-xl font-bold text-slate-900">6. Funcionamiento de las Rifas</h2>
              </div>
              <div className="pl-7 space-y-3">
                <p>
                  Las rifas en RafflyWin funcionan de la siguiente manera:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Los creadores de contenido publican rifas especificando el premio, precio por ticket, cantidad de tickets y fecha del sorteo.</li>
                  <li>Los participantes compran tickets para las rifas de su elección.</li>
                  <li>El sistema realiza sorteos automáticos en las fechas programadas utilizando algoritmos aleatorios certificados.</li>
                  <li>Los ganadores son notificados a través de la Plataforma.</li>
                  <li>El creador es responsable de coordinar y realizar la entrega del premio al ganador.</li>
                </ul>
                <p>
                  <strong>El usuario comprende y acepta que:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>La compra de tickets no garantiza obtener un premio.</li>
                  <li>Los resultados de los sorteos son definitivos e inapelables.</li>
                  <li>Las rifas son eventos de azar y los resultados no pueden predecirse ni manipularse.</li>
                  <li>RafflyWin no es responsable de la entrega de premios, que es obligación exclusiva del creador.</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Scale className="w-5 h-5 text-sky-600" />
                <h2 className="text-xl font-bold text-slate-900">7. Declaraciones del Usuario</h2>
              </div>
              <div className="pl-7 space-y-3">
                <p>
                  Al aceptar estos Términos y Condiciones y crear una cuenta en RafflyWin, usted declara 
                  expresamente que:
                </p>
                <ul className="list-disc list-inside space-y-3 ml-4">
                  <li><strong>Es mayor de 21 años</strong> y cuenta con la capacidad legal plena para participar en rifas y sorteos.</li>
                  <li><strong>Es plenamente consciente</strong> de las acciones que está por realizar y de las implicaciones legales y financieras de participar en juegos de rifas.</li>
                  <li><strong>Comprende</strong> que las rifas implican un elemento de azar y que existe la posibilidad de perder el dinero invertido en tickets sin obtener premio alguno.</li>
                  <li><strong>Acepta</strong> que RafflyWin no es responsable por los actos u omisiones de los creadores de contenido ni por la entrega de premios.</li>
                  <li><strong>Libera y exime</strong> a RafflyWin de cualquier responsabilidad derivada de disputas con otros usuarios o incumplimientos de terceros.</li>
                  <li><strong>Se compromete</strong> a utilizar la Plataforma de manera ética, legal y conforme a estos Términos y Condiciones.</li>
                </ul>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-sky-600" />
                <h2 className="text-xl font-bold text-slate-900">8. Privacidad y Protección de Datos</h2>
              </div>
              <div className="pl-7 space-y-3">
                <p>
                  RafflyWin se compromete a proteger la privacidad de sus usuarios conforme a la 
                  legislación aplicable en materia de protección de datos personales.
                </p>
                <p>
                  Al utilizar la Plataforma, usted autoriza a RafflyWin a recopilar, procesar y almacenar 
                  sus datos personales según sea necesario para:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Gestionar su cuenta y proporcionar los servicios de la Plataforma.</li>
                  <li>Procesar transacciones y pagos.</li>
                  <li>Comunicarse con usted sobre su cuenta, rifas y premios.</li>
                  <li>Verificar su identidad y edad cuando sea necesario.</li>
                  <li>Prevenir fraudes y actividades ilegales.</li>
                  <li>Cumplir con obligaciones legales.</li>
                </ul>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Scale className="w-5 h-5 text-sky-600" />
                <h2 className="text-xl font-bold text-slate-900">9. Jurisdicción y Ley Aplicable</h2>
              </div>
              <div className="pl-7 space-y-3">
                <p>
                  Estos Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes 
                  aplicables en la jurisdicción donde RafflyWin opere. Cualquier disputa relacionada 
                  con estos TyC o el uso de la Plataforma se someterá a la jurisdicción exclusiva de 
                  los tribunales competentes.
                </p>
                <p>
                  Si alguna disposición de estos TyC se considera inválida o inaplicable, las demás 
                  disposiciones permanecerán en pleno vigor y efecto.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-sky-600" />
                <h2 className="text-xl font-bold text-slate-900">10. Contacto</h2>
              </div>
              <div className="pl-7 space-y-3">
                <p>
                  Para cualquier consulta, reclamo o reporte relacionado con estos Términos y Condiciones 
                  o el funcionamiento de la Plataforma, puede contactarnos a través de:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>El sistema de mensajería interno de la Plataforma.</li>
                  <li>El formulario de contacto disponible en nuestro sitio web.</li>
                </ul>
                <p>
                  Nos comprometemos a responder a todas las consultas en un plazo razonable.
                </p>
              </div>
            </section>

          </div>

          {/* Footer Notice */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-6">
              <p className="text-center text-sky-800 font-medium">
                Al hacer clic en "Acepto los Términos y Condiciones" durante el registro, 
                usted confirma que ha leído, comprendido y aceptado todos los términos 
                establecidos en este documento.
              </p>
            </div>
          </div>

          {/* Back to Register Button */}
          <div className="mt-8 text-center">
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 px-8 py-3 bg-sky-600 text-white rounded-full font-semibold hover:bg-sky-700 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver al Registro</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Ticket className="w-6 h-6" />
            <span className="text-xl font-bold">RafflyWin</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2025 RafflyWin. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
