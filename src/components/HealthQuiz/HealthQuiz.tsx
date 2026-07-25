/**
 * Quiz de Salud - Interfaz de Recomendaciones Personalizadas
 */

import React, { useState } from 'react';
import { 
  healthQuizService, 
  QUIZ_QUESTIONS, 
  type UserProfile,
  type SupplementRegimen 
} from '../../core/knowledge-base/HealthQuizService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function HealthQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [regimen, setRegimen] = useState<SupplementRegimen | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const question = QUIZ_QUESTIONS[currentStep];
  const isMultiSelect = currentStep === 1; // Objetivos secundarios
  const isLastQuestion = currentStep === QUIZ_QUESTIONS.length - 1;

  const handleOptionSelect = (optionId: string) => {
    setAnswers(prev => {
      if (isMultiSelect) {
        const current = prev[question.id] || [];
        if (current.includes(optionId)) {
          return { ...prev, [question.id]: current.filter(id => id !== optionId) };
        } else {
          return { ...prev, [question.id]: [...current, optionId] };
        }
      } else {
        return { ...prev, [question.id]: [optionId] };
      }
    });
  };

  const handleNext = () => {
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      generateResults();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const generateResults = () => {
    const userProfile = healthQuizService.generateUserProfile(answers);
    const userRegimen = healthQuizService.generateRegimen(userProfile);
    
    setProfile(userProfile);
    setRegimen(userRegimen);
    setIsComplete(true);
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setProfile(null);
    setRegimen(null);
    setIsComplete(false);
  };

  const isOptionSelected = (optionId: string) => {
    return (answers[question.id] || []).includes(optionId);
  };

  const canProceed = isMultiSelect 
    ? (answers[question.id]?.length || 0) > 0
    : (answers[question.id]?.length || 0) > 0;

  // Renderizar resultados
  if (isComplete && regimen) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Tu Régimen Personalizado</CardTitle>
            <CardDescription>
              Basado en tus objetivos de salud, aquí están tus suplementos recomendados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Horario */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">🌅 Mañana</h4>
                <p className="text-sm text-yellow-700">
                  {regimen.horario.maniana.length > 0 
                    ? regimen.horario.maniana.map(id => regimen.ingredientes.find(i => i.ingrediente.id === id)?.ingrediente.nombre).join(', ')
                    : 'Ninguno'}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🌞 Con Comidas</h4>
                <p className="text-sm text-blue-700">
                  {regimen.horario.conComidas.length > 0 
                    ? regimen.horario.conComidas.map(id => regimen.ingredientes.find(i => i.ingrediente.id === id)?.ingrediente.nombre).join(', ')
                    : 'Ninguno'}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">🌆 Tarde</h4>
                <p className="text-sm text-purple-700">
                  {regimen.horario.tarde.length > 0 
                    ? regimen.horario.tarde.map(id => regimen.ingredientes.find(i => i.ingrediente.id === id)?.ingrediente.nombre).join(', ')
                    : 'Ninguno'}
                </p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-indigo-800 mb-2">🌙 Noche</h4>
                <p className="text-sm text-indigo-700">
                  {regimen.horario.noche.length > 0 
                    ? regimen.horario.noche.map(id => regimen.ingredientes.find(i => i.ingrediente.id === id)?.ingrediente.nombre).join(', ')
                    : 'Ninguno'}
                </p>
              </div>
            </div>

            {/* Recomendaciones detalladas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Suplementos Recomendados</h3>
              {regimen.ingredientes.map((rec, index) => (
                <Card key={rec.ingrediente.id} className={index === 0 ? 'border-primary bg-primary/5' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">
                          {index === 0 && <Badge className="mr-2">⭐ Principal</Badge>}
                          {rec.ingrediente.nombre}
                        </h4>
                        <Badge variant="outline">{rec.ingrediente.categoria}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{Math.round(rec.puntuacion)}%</div>
                        <p className="text-xs text-muted-foreground">Puntuación</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{rec.ingrediente.descripcion}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-sm mb-2">Razones:</h5>
                        <ul className="text-sm space-y-1">
                          {rec.razones.map((r, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="text-success">✓</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm mb-2">Sinergias:</h5>
                        <div className="flex flex-wrap gap-2">
                          {rec.sinergias_principales.map(synId => {
                            const synIng = regimen.ingredientes.find(i => i.ingrediente.id === synId);
                            return synIng ? (
                              <Badge key={synId} variant="success" className="text-xs">
                                + {synIng.ingrediente.nombre}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">Dosis sugerida: </span>
                        <span className="text-sm">{rec.dosis_sugerida}</span>
                      </div>
                      {rec.precio_estimado && (
                        <Badge variant="outline">{rec.precio_estimado}/mes</Badge>
                      )}
                    </div>

                    {rec.contraindicaciones_potenciales.length > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Precaución: {rec.contraindicaciones_potenciales[0]}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Consejos */}
            {regimen.consejos.length > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800">💡 Consejos Prácticos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {regimen.consejos.map((tip, i) => (
                      <li key={i} className="text-sm text-green-700">{tip}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Disclaimer */}
            <Card className="bg-muted">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Nota:</strong> Esta información es solo orientativa y no reemplaza 
                  el consejo de un profesional de la salud. Consulta con tu médico antes de 
                  comenzar cualquier régimen de suplementos, especialmente si tomas medicamentos 
                  o tienes condiciones médicas.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button onClick={resetQuiz} variant="outline" size="lg">
                Hacer el Quiz de Nuevo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderizar preguntas
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Paso {currentStep + 1} de {QUIZ_QUESTIONS.length}</span>
          <span>{Math.round((currentStep + 1) / QUIZ_QUESTIONS.length * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{question.pregunta}</CardTitle>
          {isMultiSelect && (
            <CardDescription>
              Selecciona todas las que apliquen
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {question.opciones.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              className={`w-full p-4 rounded-lg border text-left transition-all flex items-center gap-4 ${
                isOptionSelected(option.id)
                  ? 'border-primary bg-primary/10 ring-2 ring-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                isOptionSelected(option.id)
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground'
              }`}>
                {isOptionSelected(option.id) && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {option.icono && <span className="text-2xl">{option.icono}</span>}
              <span className="font-medium">{option.texto}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          onClick={handleBack} 
          variant="outline"
          disabled={currentStep === 0}
        >
          Anterior
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!canProceed}
        >
          {isLastQuestion ? 'Ver Resultados' : 'Siguiente'}
        </Button>
      </div>
    </div>
  );
}

export default HealthQuiz;
