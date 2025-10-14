#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Implementar sistema de mensajería completo tipo WhatsApp con las siguientes características:
  1. Vista de conversaciones a la izquierda con lista de usuarios
  2. Vista de mensajes tipo chat a la derecha
  3. Auto-actualización de mensajes cada 10 segundos
  4. Búsqueda/filtrado de conversaciones por nombre de usuario
  5. Eliminación masiva de mensajes para administrador
  6. Vista de mensajes archivados
  7. Envío de mensajes desde página de gestión de rifas (creadores y admin)

backend:
  - task: "Endpoint para obtener mensajes archivados"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Agregado endpoint GET /api/messages/archived para obtener mensajes archivados del usuario actual"

  - task: "Endpoints de mensajería existentes"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Endpoints ya existentes: POST /api/messages (enviar), GET /api/messages (listar), GET /api/messages/conversation/:id, POST /api/messages/:id/archive, POST /api/messages/:id/unarchive, DELETE /api/messages/:id (admin), GET /api/admin/messages/all (admin)"

frontend:
  - task: "Página de mensajería tipo WhatsApp"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/MessagesPage.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implementada interfaz tipo WhatsApp con lista de conversaciones a la izquierda y chat a la derecha. Incluye búsqueda, archivado, eliminación masiva (admin), auto-actualización cada 10s"

  - task: "Integración de mensajería en navegación"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/App.js, /app/frontend/src/pages/ExplorePage.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Agregada ruta /messages en App.js y enlace en navegación de ExplorePage con badge de mensajes no leídos"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Endpoint para obtener mensajes archivados"
    - "Página de mensajería tipo WhatsApp"
    - "Integración de mensajería en navegación"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      He implementado el sistema de mensajería completo con las siguientes características:
      
      Backend:
      - Agregado endpoint GET /api/messages/archived para filtrar mensajes archivados
      - Todos los demás endpoints ya existían (envío, listado, conversaciones, archivar, eliminar)
      
      Frontend:
      - MessagesPage.js con interfaz tipo WhatsApp
      - Lista de conversaciones a la izquierda con avatares y preview del último mensaje
      - Vista de chat a la derecha con burbujas de mensajes
      - Auto-actualización cada 10 segundos mediante polling
      - Búsqueda de conversaciones por nombre
      - Toggle para ver mensajes archivados/activos
      - Modo de eliminación masiva para administradores
      - Botón para archivar/desarchivar conversaciones completas
      - Enter para enviar mensaje, Shift+Enter para nueva línea
      - Badge de mensajes no leídos en navegación
      
      Necesita testing manual por parte del usuario como solicitó.