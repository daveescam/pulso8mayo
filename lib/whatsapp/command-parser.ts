/**
 * WhatsApp Command Parser
 * 
 * Parses natural language commands from WhatsApp messages.
 * Supports Spanish and English with typo tolerance.
 */

export interface ParsedCommand {
    type: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END' | 'STATUS' | 'TASKS' | 'HELP' | 'WORKFLOW' | 'UNKNOWN';
    params?: Record<string, any>;
    originalMessage: string;
    workflowName?: string;
}

export class CommandParser {
    // Command patterns (Spanish and English)
    private patterns = {
        CLOCK_IN: [
            /^(entrada|entrar|clock\s*in|checkin|check\s*in|llegada|inicio)$/i,
            /^(buenos?\s+d[ií]as?|hola|hi|hello)$/i, // Greetings can trigger clock in
        ],
        CLOCK_OUT: [
            /^(salida|salir|clock\s*out|checkout|check\s*out|fin|terminar|hasta\s+luego)$/i,
        ],
        BREAK_START: [
            /^(pausa|break|descanso|comida|almuerzo|lunch)$/i,
            /^(voy\s+a|me\s+voy\s+a)\s+(comer|descansar|pausar)$/i,
        ],
        BREAK_END: [
            /^(fin\s+pausa|end\s+break|terminar\s+pausa|regreso|vuelvo)$/i,
            /^(ya\s+)?(regres[eé]|volv[ií])$/i,
        ],
        STATUS: [
            /^(status|estado|horas|resumen|summary|tiempo)$/i,
            /^(cu[aá]ntas?\s+horas?|how\s+many\s+hours?)$/i,
        ],
        TASKS: [
            /^(tareas?|pendientes?|workflows?|trabajos?)$/i,
            /^(qu[eé]\s+tengo|what\s+do\s+i\s+have)$/i,
        ],
        HELP: [
            /^(ayuda|help|comandos?|commands?|\?)$/i,
        ],
        WORKFLOW: [
            /^(iniciar?\s+|empezar?\s+|comenzar?\s+|abrir?\s+)?(.+)$/i,
        ],
    };

    /**
     * Parse a message into a command
     */
    parse(message: string): ParsedCommand {
        // Normalize message
        const normalized = message.trim().toLowerCase();

        // Try to match against patterns
        for (const [commandType, patterns] of Object.entries(this.patterns)) {
            for (const pattern of patterns) {
                const match = pattern.exec(normalized);
                if (match) {
                    // Special handling for WORKFLOW command
                    if (commandType === 'WORKFLOW') {
                        // Extract workflow name from message
                        const workflowKeywords = ['limpieza', 'cocina', 'apertura', 'cierre', 'calidad', 'recepci'];
                        const hasWorkflowKeyword = workflowKeywords.some(keyword => normalized.includes(keyword));
                        
                        if (hasWorkflowKeyword) {
                            return {
                                type: 'WORKFLOW' as any,
                                originalMessage: message,
                                workflowName: normalized.replace(/^(iniciar?|empezar?|comenzar?|abrir?)\s*/i, '').trim(),
                            };
                        }
                        // Not a workflow command, continue
                        continue;
                    }

                    return {
                        type: commandType as any,
                        originalMessage: message,
                    };
                }
            }
        }

        // No match found
        return {
            type: 'UNKNOWN',
            originalMessage: message,
        };
    }

    /**
     * Get help message with all available commands
     */
    getHelpMessage(): string {
        return `📱 *Comandos Disponibles*

⏰ *Control de Horario*
• entrada / clock in - Registrar entrada
• salida / clock out - Registrar salida
• pausa / break - Iniciar pausa
• fin pausa / end break - Terminar pausa
• horas / status - Ver resumen del día

📋 *Tareas*
• tareas / tasks - Ver tareas pendientes

🔄 *Workflows*
• iniciar limpieza cocina - Iniciar workflow
• Enviar foto - Enviar evidencia

❓ *Ayuda*
• ayuda / help - Ver este mensaje

💡 *Tip:* También puedes usar saludos como "Buenos días" para registrar entrada.`;
    }

    /**
     * Get unknown command response
     */
    getUnknownCommandMessage(): string {
        return `❓ No entendí ese comando.

Escribe *ayuda* para ver los comandos disponibles.`;
    }
}

// Singleton instance
export const commandParser = new CommandParser();
